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
    COLLECT (taxon.name) AS taxons`;
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
      .join(`\n ${state.combinator.toUpperCase()} `);
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
    COLLECT (o2.name) AS all_organisations
    ORDER BY n.pagerank DESC
    LIMIT ${state.maxNumberOfResultsRequested};`
};


const linkSearchButtonClicked = async function(url) {
  const justThePath = url.replace(/.*\.gov.uk/, '');
  state.searchQuery = `
    MATCH (n:Cid)-[:HYPERLINKS_TO]->(n2:Cid)
    WHERE n2.name = "${justThePath}"
    WITH n
    OPTIONAL MATCH (n:Cid)-[:IS_TAGGED_TO]->(taxon:Taxon)
    RETURN DISTINCT ${returnFields()}
    LIMIT ${state.maxNumberOfResultsRequested}`;
  queryGraph(state.searchQuery);
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
    MATCH (n:Cid)-[:IS_TAGGED_TO]->(taxon:Taxon)
    WHERE ${whereStatement}
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

const searchButtonClicked = async function() {
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
    queryGraph(state.searchQuery);
  }
};


const queryGraph = async function(query) {
  console.log('running', state.searchQuery)
  try {
    const queryResults = await state.neo4jSession.readTransaction(tx =>
      tx.run(query));
    console.log(queryResults)
    return handleEvent({type:'neo4j-callback-ok', data: queryResults});
  } catch (e) {
    console.log('Neo4j error', e);
    return handleEvent({type:'neo4j-callback-fail'});
  }
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
      case "cypher-search":
        state.searchQuery = id('cypher').value;
        state.waiting = true;
        cypherSearchButtonClicked();
        break;
      case "clear":
        state.searchResults = null;
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
  case 'neo4j-callback-ok':
    state.searchResults = event.data;
    state.waiting = false;
    state.errorText = null;
  break;
  case 'neo4j-callback-fail':
    state.searchResults = null;
    state.waiting = false;
    state.errorText = 'There was a problem querying the GovGraph. Are you on the VPN? If yes, you may have found a bug. Please send details to the Data Labs';
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

    if (state.selectedWords !== '') searchParams.set('selected-words', state.selectedWords);
    if (state.excludedWords !== '') searchParams.set('excluded-words', state.excludedWords);
    if (state.externalUrl !== '') searchParams.set('external-url', state.externalUrl);
    if (state.linkSearchUrl !== '') searchParams.set('link-search-url', state.linkSearchUrl);
    if (state.contentIds !== '') searchParams.set('content-ids', state.contentIds);
    if (state.combinator !== 'and') searchParams.set('combinator', state.combinator);
    if (state.selectedTaxon !== '') searchParams.set('selected-taxon', state.selectedTaxon);
    if (state.caseSensitive) searchParams.set('case-sensitive', state.caseSensitive);
    if (state.activeMode !== 'keyword-search') searchParams.set('active-mode', state.activeMode);
    if (state.maxNumberOfResultsRequested !== 100) searchParams.set('max-results', state.maxNumberOfResultsRequested);
    if (!state.whereToSearch.title) searchParams.set('search-in-title', 'false')
    if (state.whereToSearch.description) searchParams.set('search-in-description', 'true')
    if (state.whereToSearch.text) searchParams.set('search-in-text', 'true')

    let newRelativePathQuery = window.location.pathname;
    if (searchParams.toString().length > 0) {
      newRelativePathQuery += '?' + searchParams.toString();
    }
    history.pushState(null, '', newRelativePathQuery);
  }
}


export { handleEvent };
