import { state } from './state.js';
import { id, sanitise } from './utils.js';
import { view } from './view.js';


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
    n.name as name,
    n.title AS title,
    n.documentType AS documentType,
    n.contentID AS contentID,
    n.publishing_app AS publishing_app,
    n.first_published_at AS first_published_at,
    n.public_updated_at AS public_updated_at,
    n.pagerank AS pagerank,
    COLLECT (taxon.name) AS taxons,
    COLLECT (o.name) AS primary_organisation,
    COLLECT (o2.name) AS all_organisations
`;
};

const keywordSearchQuery = function(state, keywords, exclusions) {
  const fieldsToSearch = [
    state.whereToSearch.title?'title':null,
    state.whereToSearch.description?'description':null,
    state.whereToSearch.text?'text':null
  ].filter(item => item)

  const inclusionClause = 'WHERE\n' +
    keywords
      .map(word => multiContainsClause(fieldsToSearch, word, state.caseSensitive))
      .join(`\n ${state.combinator.toUpperCase()} `);
  const exclusionClause = exclusions.length ?
    ('WITH * WHERE NOT ' + exclusions.map(word => multiContainsClause(fieldsToSearch, word, state.caseSensitive)).join(`\n OR `)) : '';

  const taxon = state.selectedTaxon;

  return `
    MATCH (n:Cid)
    ${inclusionClause}
    ${exclusionClause}
    WITH n
    OPTIONAL MATCH (n:Cid)-[r:HAS_PRIMARY_PUBLISHING_ORGANISATION]->(o:Organisation)
    OPTIONAL MATCH (n:Cid)-[:HAS_ORGANISATIONS]->(o2:Organisation)
    OPTIONAL MATCH (n:Cid)-[:IS_TAGGED_TO]->(taxon:Taxon)${taxon.length > 0 ? '<-[:HAS_PARENT*]-(c:Taxon)' : '' }
    ${taxon.length > 0 ? `AND (taxon.name = "${taxon}" OR c.name = "${taxon}")` : ''}
    RETURN ${returnFields()}
    ORDER BY n.pagerank DESC
    LIMIT ${state.maxNumberOfResultsRequested};`
};


const linkSearchButtonClicked = async function() {
  const justThePath = state.linkSearchUrl.replace(/.*\.gov.uk/, '');
  state.searchQuery = `
    MATCH (n:Cid)-[:HYPERLINKS_TO]->(n2:Cid)
    WHERE n2.name = "${justThePath}"
    WITH n
    OPTIONAL MATCH (n:Cid)-[r:HAS_PRIMARY_PUBLISHING_ORGANISATION]->(o:Organisation)
    OPTIONAL MATCH (n:Cid)-[:HAS_ORGANISATIONS]->(o2:Organisation)
    OPTIONAL MATCH (n:Cid)-[:IS_TAGGED_TO]->(taxon:Taxon)
    RETURN DISTINCT ${returnFields()}
    LIMIT ${state.maxNumberOfResultsRequested}`;
  queryGraph(state.searchQuery);
};


const externalSearchButtonClicked = async function() {
  state.searchQuery = `
    MATCH (n:Cid) -[:HYPERLINKS_TO]-> (e:ExternalPage)
    WHERE e.name CONTAINS "${state.externalUrl}"
    WITH n
    OPTIONAL MATCH (n:Cid)-[r:HAS_PRIMARY_PUBLISHING_ORGANISATION]->(o:Organisation)
    OPTIONAL MATCH (n:Cid)-[:HAS_ORGANISATIONS]->(o2:Organisation)
    OPTIONAL MATCH (n:Cid)-[:IS_TAGGED_TO]->(taxon:Taxon)
    RETURN
    ${returnFields()}
    LIMIT ${state.maxNumberOfResultsRequested}`;
  queryGraph(state.searchQuery);
};


const contentIdSearchButtonClicked = async function() {
  const contentIds = state.contentIds
    .split(/[^a-zA-Z0-9-]+/)
    .filter(d=>d.length>0)
    .map(s => s.toLowerCase());
  const whereStatement = contentIds.map(cid => `n.contentID="${cid}" `).join(' OR ');
  state.searchQuery = `
    MATCH (n:Cid)
    WHERE ${whereStatement}
    WITH n
    OPTIONAL MATCH (n:Cid)-[:IS_TAGGED_TO]->(taxon:Taxon)
    RETURN
    ${returnFields()}
    LIMIT ${state.maxNumberOfResultsRequested}`;
  queryGraph(state.searchQuery);
};

const cypherSearchButtonClicked = async function() {
  queryGraph(state.searchQuery);
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

const keywordSearchButtonClicked = async function() {
  state.errorText = null;
  const keywords = splitKeywords(state.selectedWords)
        .filter(d=>d.length>0)
        .map(s => s.toLowerCase());
  const excludedKeywords = splitKeywords(state.excludedWords)
        .filter(d=>d.length>0)
        .map(s => s.toLowerCase());
  if (keywords.length > 0) {
    state.searchQuery = keywordSearchQuery(state, keywords, excludedKeywords);
    queryGraph(state.searchQuery);
  } else {
    state.waiting = false;
  }
};


const queryGraph = async function(query) {
  console.log(query)
  state.neo4jSession
    .run(query)
    .then(result => handleEvent({type:'neo4j-callback-ok', result}))
    .catch(error => handleEvent({type:'neo4j-callback-fail', error}));

  handleEvent({type: 'neo4j-running'});
};


const handleEvent = async function(event) {
  let fieldClicked;
  switch(event.type) {
    case "dom":
      switch(event.id) {
      case "keyword-search":
        state.selectedWords = sanitise(id('keyword').value);
        state.excludedWords = sanitise(id('excluded-keyword').value);
        state.combinator = id('and-or').selectedIndex == 0 ? 'and' : 'or';
        state.selectedTaxon = document.querySelector('#taxon input').value;
        state.whereToSearch.title = id('search-title').checked;
        state.whereToSearch.description = id('search-description').checked;
        state.whereToSearch.text = id('search-text').checked;
        state.caseSensitive = id('case-sensitive').checked;
        keywordSearchButtonClicked();
        break;
      case "contentid-search":
        state.contentIds = id('contentid').value;
        contentIdSearchButtonClicked();
        break;
      case "external-search":
        state.externalUrl = id('external').value;
        externalSearchButtonClicked();
        break;
      case "link-search":
        state.linkSearchUrl = id('link-search').value;
        linkSearchButtonClicked();
        break;
      case "cypher-search":
        state.searchQuery = id('cypher').value;
        cypherSearchButtonClicked();
        break;
      case 'button-select-keyword-search':
        state.activeMode = 'keyword-search';
        break;
      case 'button-select-contentid-search':
        state.activeMode = 'contentid-search';
        break;
      case 'button-select-cypher-search':
        state.activeMode = 'cypher-search';
        break;
      case 'button-select-external-search':
        state.activeMode = 'external-search';
        break;
      case 'button-select-link-search':
        state.activeMode = 'link-search';
        break;
      default:
        fieldClicked = event.id.match(/show-field-(.*)/);
        if (fieldClicked) {
          state.showFields[fieldClicked[1]] = id(event.id).checked;
        } else {
          console.log('unknown DOM event received:', event);
        }
      }
    break;

  // non-dom events
  case 'neo4j-running':
    state.waiting = true;
    break;
  case 'neo4j-callback-ok':
    state.searchResults = event.result;
    state.waiting = false;
    state.errorText = null;
  break;
  case 'neo4j-callback-fail':
    state.searchResults = null;
    state.waiting = false;
    state.errorText = `There was a problem querying the GovGraph: ${event.error}`;
  break;
  default:
    console.log('unknown event:', event);
  }
  updateUrl();
  view();
};


const updateUrl = function() {
  if ('URLSearchParams' in window) {
    var searchParams = new URLSearchParams();

    if (state.activeMode !== 'keyword-search') searchParams.set('active-mode', state.activeMode);
    switch (state.activeMode) {
    case 'keyword-search':
      if (state.selectedWords !== '') searchParams.set('selected-words', state.selectedWords);
      if (state.excludedWords !== '') searchParams.set('excluded-words', state.excludedWords);
      if (state.combinator !== 'and') searchParams.set('combinator', state.combinator);
      if (state.selectedTaxon !== '') searchParams.set('selected-taxon', state.selectedTaxon);
      if (state.caseSensitive) searchParams.set('case-sensitive', state.caseSensitive);
      if (!state.whereToSearch.title) searchParams.set('search-in-title', 'false')
      if (state.whereToSearch.description) searchParams.set('search-in-description', 'true')
      if (state.whereToSearch.text) searchParams.set('search-in-text', 'true')
    break;
    case 'contentid-search':
      if (state.contentIds !== '') searchParams.set('content-ids', state.contentIds);
    break;
    case 'external-search':
      if (state.externalUrl !== '') searchParams.set('external-url', state.externalUrl);
    break;
    case 'link-search':
      if (state.linkSearchUrl !== '') searchParams.set('link-search-url', state.linkSearchUrl);
    break;
    case 'cypher-search':
    break;
    default:
      console.log('update URL unknown activeMode:', state.activeMode);
    }

    let newRelativePathQuery = window.location.pathname;
    if (searchParams.toString().length > 0) {
      newRelativePathQuery += '?' + searchParams.toString();
    }
    history.pushState(null, '', newRelativePathQuery);
  }
}


export {
  handleEvent,
  keywordSearchButtonClicked,
  contentIdSearchButtonClicked,
  linkSearchButtonClicked,
  externalSearchButtonClicked,
  cypherSearchButtonClicked
};
