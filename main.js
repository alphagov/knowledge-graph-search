/* global neo4j, view */


//==================================================
// Utils
//==================================================


const id = x => document.getElementById(x);


const tagBody = '(?:[^"\'>]|"[^"]*"|\'[^\']*\')*';

const tagOrComment = new RegExp(
    '<(?:'
    // Comment body.
    + '!--(?:(?:-*[^->])*--+|-?)'
    // Special "raw text" elements whose content should be elided.
    + '|script\\b' + tagBody + '>[\\s\\S]*?</script\\s*'
    + '|style\\b' + tagBody + '>[\\s\\S]*?</style\\s*'
    // Regular name
    + '|/?[a-z]'
    + tagBody
    + ')>',
    'gi');

const sanitise = function(text) {
  let oldText;
  do {
    oldText = text;
    text = text.replace(tagOrComment, '');
  } while (text !== oldText);
  return text.replace(/</g, '&lt;').replace(/""*/g, '"');
};



//==================================================
// STATE
//==================================================


const state = {
  user: '',
  password: '',
  server: '',
  taxons: [], // list of names of all the taxons
  errorText: null,
  neo4jSession: null,
  combinator: 'and', // or 'or'
  selectedWords: '',
  excludedWords: '',
  selectedTaxon: '',
  contentIds: '',
  externalUrl: '',
  linkSearchUrl: '',
  searchQuery: null,
  searchResults: null,
  maxNumberOfResultsRequested: 100,
  showFields: {
    contentId: false,
    documentType: true,
    publishingApp: true,
    firstPublished: true,
    lastUpdated: true,
    taxons: false
  },
  whereToSearch: {
    title: true,
    description: false,
    text: false
  },
  caseSensitive: false,
  activeMode: 'keyword-search',
  //  possible values: 'keyword-search', 'contentid-search', 'external-search', 'link-search'
  waiting: false // whether we're waiting for a request to return
};


//==================================================
// UPDATE
//==================================================


const linkSearchButtonClicked = async function(url) {
  const justThePath = url.replace(/.*\.gov.uk/, '');
  state.searchQuery = `
    MATCH (t:Cid)<-[HYPERLINKS_TO]-(n:Cid)
    MATCH (n:Cid)-[:IS_TAGGED_TO]->(taxon:Taxon)
    WHERE t.name="${justThePath}"
    RETURN ${returnFields()}
    LIMIT ${state.maxNumberOfResultsRequested}`;
  const queryResults = await state.neo4jSession.readTransaction(tx =>
    tx.run(state.searchQuery));
  handleEvent({type:'neo4j-callback-ok', data: queryResults});
};


const externalSearchButtonClicked = async function(url) {
  state.searchQuery = `
    MATCH (n:Cid) -[:HYPERLINKS_TO]-> (e:ExternalPage)
    MATCH (n:Cid)-[:IS_TAGGED_TO]->(taxon:Taxon)
    WHERE e.name CONTAINS "${url}"
    RETURN
    ${returnFields()},
    e.name AS externalUrl
    LIMIT ${state.maxNumberOfResultsRequested}`;
  const queryResults = await state.neo4jSession.readTransaction(tx =>
    tx.run(state.searchQuery));
  handleEvent({type:'neo4j-callback-ok', data: queryResults});
};


const contentIdSearchButtonClicked = async function() {
  const contentIds = state.contentIds
    .split(/[^a-zA-Z0-9-]+/)
    .filter(d=>d.length>0)
    .map(s => s.toLowerCase());
  const whereStatement = contentIds.map(cid => `n.contentID="${cid}" `).join(' OR ');
  state.searchQuery = `
    MATCH (n:Cid)
    MATCH (n:Cid)-[:IS_TAGGED_TO]->(taxon:Taxon)
    WHERE ${whereStatement}
    RETURN
    ${returnFields()}
    LIMIT ${state.maxNumberOfResultsRequested}`;
  const queryResults = await state.neo4jSession.readTransaction(tx =>
    tx.run(state.searchQuery));
  handleEvent({type:'neo4j-callback-ok', data: queryResults});
};


const splitKeywords = function(keywords) {
  var regexp = /[^\s"]+|"([^"]*)"/gi;
  var output = [];
  let match;
  do {
    match = regexp.exec(keywords);
    if (match) {
        output.push(match[1] ? match[1] : match[0]);
    }
  } while (match);
  return output;
};

const searchButtonClicked = function() {
  if (state.selectedWords.length < 3) {
    state.errorText = 'Please make your search terms longer to avoid returning too many results';
    state.waiting = false;
  } else {
    state.errorText = null;
    const keywords = splitKeywords(state.selectedWords)
          .filter(d=>d.length>0)
          .map(s => s.toLowerCase());
    const excludedKeywords = splitKeywords(state.excludedWords)
          .filter(d=>d.length>0)
          .map(s => s.toLowerCase());
    state.searchQuery = buildQuery(state, keywords, excludedKeywords);
    console.log('running', state.searchQuery)
    state.neo4jSession.run(state.searchQuery)
      .then(async results => {
        await handleEvent({type:'neo4j-callback-ok', data: results})
      });
  }
};


const handleEvent = async function(event) {
  switch(event.type) {
    case "dom":
      switch(event.id) {
      case "keyword-search":
        state.selectedWords = sanitise(id('keyword').value);
        state.excludedWords = sanitise(id('excluded-keyword').value);
        state.combinator = id('and-or').selectedIndex == 0 ? 'AND' : 'OR';
        state.selectedTaxon = id('taxons').selectedIndex > 0 ? state.taxons[id('taxons').selectedIndex - 1] : '';
        state.whereToSearch.title = id('search-title').checked;
        state.whereToSearch.description = id('search-description').checked;
        state.whereToSearch.text = id('search-text').checked;
        state.caseSensitive = id('case-sensitive').checked;
        state.maxNumberOfResultsRequested = sanitise(id('nb-results').value);
        state.waiting = true;
        searchButtonClicked();
        break;
      case "contentid-search":
        state.contentIds = id('contentid').value;
        state.waiting = true;
        contentIdSearchButtonClicked();
        break;
      case "external-search":
        state.externalUrl = id('external').value;
        state.waiting = true;
        externalSearchButtonClicked(state.externalUrl);
        break;
      case "link-search":
        state.linkSearchUrl = id('link-search').value;
        state.waiting = true;
        linkSearchButtonClicked(state.linkSearchUrl);
        break;
      case "clear":
        state.searchResults = null;
        break;
      case "show-contentid":
        state.showFields.contentId = id('show-contentid').checked;
        break;
      case "show-doctype":
        state.showFields.documentType = id('show-doctype').checked;
        break;
      case "show-publishingapp":
        state.showFields.publishingApp = id('show-publishingapp').checked;
        break;
      case "show-firstpublished":
        state.showFields.firstPublished = id('show-firstpublished').checked;
        break;
      case "show-lastupdated":
        state.showFields.lastUpdated = id('show-lastupdated').checked;
        break;
      case "show-taxons":
        state.showFields.taxons = id('show-taxons').checked;
        break;
      case 'button-select-keyword-search':
        state.activeMode = 'keyword-search';
        break;
      case 'button-select-contentid-search':
        state.activeMode = 'contentid-search';
        break;
      case 'button-select-external-search':
        state.activeMode = 'external-search';
        break;
      case 'button-select-link-search':
        state.activeMode = 'link-search';
        break;
      default:
        console.log('unknown DOM event received:', event);
      }
    break;

  // non-dom events
  case 'neo4j-callback-ok':
    state.searchResults = event.data;
    state.waiting = false;
    state.errorText = null;
  break;
  default:
    console.log('unknown event:', event);
  }
  view();
};



//==================================================
// Cypher query methods
//==================================================

const containsClause = function(field, word, caseSensitive) {
  return caseSensitive ?
    `(n.${field} CONTAINS "${word}")`
  :
    `(toLower(n.${field}) CONTAINS toLower("${word}"))`
  ;

}

const multiContainsClause = function(fields, word, caseSensitive) {
  return '(' + fields
    .map(field => containsClause(field, word, caseSensitive))
    .join(' OR ') + ')'
}

const returnFields = function() {
  return `
    "https://www.gov.uk"+n.name AS url,
    n.name AS slug,
    n.title AS title,
    n.documentType AS documentType,
    n.contentID AS contentID,
    n.publishing_app AS publishingApp,
    n.first_published_at AS firstPublished,
    n.public_updated_at AS lastUpdated,
    COLLECT (taxon.name) AS taxons
  `;
};

const buildQuery = function(state, keywords, exclusions) {
  const fieldsToSearch = [
    state.whereToSearch.title?'title':null,
    state.whereToSearch.description?'description':null,
    state.whereToSearch.text?'text':null
  ].filter(item => item)

  const inclusionClause = 'WHERE\n' +
    keywords
      .map(word => multiContainsClause(fieldsToSearch, word, state.caseSensitive))
      .join(`\n ${state.combinator} `);
  const exclusionClause = exclusions.length ?
    ('WITH * WHERE NOT ' + exclusions.map(word => multiContainsClause(fieldsToSearch, word, state.caseSensitive)).join(`\n OR `)) : '';

  const taxon = state.selectedTaxon;

  return `
    MATCH (n:Cid)-[r:HAS_PRIMARY_PUBLISHING_ORGANISATION]->(o:Organisation)
    MATCH (n:Cid)-[:HAS_ORGANISATIONS]->(o2:Organisation)
    MATCH (n:Cid)-[:IS_TAGGED_TO]->(taxon:Taxon)${taxon.length > 0 ? '<-[:HAS_PARENT*]-(c:Taxon)' : '' }
    ${inclusionClause}
    ${exclusionClause}
    ${taxon.length > 0 ? `AND (taxon.name = "${taxon}" OR c.name = "${taxon}")` : ''}
    RETURN ${returnFields()},
    COLLECT (o.name) AS primary_organisation,
    COLLECT (o2.name) AS all_organisations, n.pagerank AS popularity
    ORDER BY n.pagerank DESC
    LIMIT ${state.maxNumberOfResultsRequested};`
};


//==================================================
// INIT
//==================================================

const init = async function() {
  // First, look if there's a file with authentication params
  await fetch('params.json')
    .then(async response => {
      const data = await response.json();

      state.server = data.server;
      state.user = data.user;
      state.password = data.password;
    }).catch(error => {
      console.warn(error);
      state.errorText('Failed to retrieve credentials to connect to the Knowledge Graph');
    });

  // Initialise neo4j
  state.neo4jDriver = neo4j.driver(state.server, neo4j.auth.basic(state.user, state.password));
  state.neo4jSession = state.neo4jDriver.session({ defaultAccessMode: neo4j.session.READ });
  state.errorText = null;


  // Get the list of all the taxons
  const taxons = await state.neo4jSession.readTransaction(tx =>
    tx.run('MATCH (t:Taxon) RETURN t.name'));
  state.taxons = taxons.records.map(taxon => taxon._fields[0]).sort();





};


//==================================================
// START
//==================================================


(async () => {
  await init();
  view();
})();
