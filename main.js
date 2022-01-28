/* global neo4j */


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
  return text.replace(/</g, '&lt;').replace('"', '&quot;');
};



//==================================================
// STATE
//==================================================


const state = {
  user: '',
  password: '',
  server: '',
  errorText: null,
  neo4jSession: null,
  combinator: 'and', // or 'or'
  selectedWords: '',
  excludedWords: '',
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
    lastUpdated: true
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
    MATCH (t:Cid)<-[HYPERLINKS_TO]-(n:Cid) WHERE t.name="${justThePath}"
    RETURN ${returnFields()}
    LIMIT ${state.maxNumberOfResultsRequested}`;
  const queryResults = await state.neo4jSession.readTransaction(tx =>
    tx.run(state.searchQuery));
  handleEvent({type:'neo4j-callback-ok', data: queryResults});
};


const externalSearchButtonClicked = async function(url) {
  state.searchQuery = `
    MATCH (n:Cid) -[:HYPERLINKS_TO]-> (e:ExternalPage)
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
  state.searchQuery = `MATCH (n:Cid) WHERE ${whereStatement}
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
    state.searchQuery = buildQuery(state.whereToSearch, keywords, excludedKeywords, state.combinator, state.caseSensitive);
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
// VIEW functions
//==================================================

const view = function() {
  const html = [];
  html.push(`
    <main class="govuk-main-wrapper " id="main-content" role="main">
      <h1 class="govuk-heading-xl">Search the Knowledge Graph</h1>
      <h2 class="govuk-heading-s">Please note that you must be on the GDS VPN for searches to work</h2>`);

  if (state.errorText) {
    html.push(`
      <div class="govuk-error-summary" aria-labelledby="error-summary-title" role="alert" tabindex="-1" data-module="govuk-error-summary">
        <h2 class="govuk-error-summary__title" id="error-summary-title">Error</h2>
        <p class="govuk-body">${state.errorText}</p>
      </div>`)
  }

  if (state.searchResults === null) {
    html.push(`
        <p class="govuk-body mode-buttons">
          <button class="${state.activeMode==='keyword-search'?'search-active':''}"
                  id="button-select-keyword-search">Keyword search</button>
          <button class="${state.activeMode==='contentid-search'?'search-active':''}"
                  id="button-select-contentid-search">Content ID search</button>
          <button class="${state.activeMode==='external-search'?'search-active':''}"
                  id="button-select-external-search">External page search</button>
          <button class="${state.activeMode==='link-search'?'search-active':''}"
                  id="button-select-link-search">Link search</button>
        </p>
        <div class="search-panel">`);

    switch(state.activeMode) {
      case 'keyword-search':
      html.push(`
            <div class="govuk-form-group" id="keyword-search-panel">
              <p class="govuk-body">
               Type keywords to find pages with title or content containing<br/>
                <select class="govuk-select" id="and-or">
                  <option name="and" ${state.combinator === 'and' ? 'selected' : ''}>all the words:</option>
                  <option name="or" ${state.combinator === 'or' ? 'selected' : ''}>any of the words:</option>
                </select>
                <input class="govuk-input govuk-input--width-20" id="keyword" placeholder="eg: cat dog &quot;health certificate&quot;" value='${sanitise(state.selectedWords)}'/>

              <br/>but not:

                <input class="govuk-input govuk-input--width-20" id="excluded-keyword" placeholder="leave blank if no exclusions" value='${sanitise(state.excludedWords)}'/>
              </p>
              <div id="search-locations-wrapper">
                Search in:
                <ul class="kg-checkboxes" id="search-locations">
                  <li class="kg-checkboxes__item">
                    <input class="kg-checkboxes__input"
                           type="checkbox" id="search-title"
                           ${state.whereToSearch.title ? 'checked' : ''}/>
                    <label class="kg-label kg-checkboxes__label">Title</label>
                  </li>
                  <li class="kg-checkboxes__item">
                    <input class="kg-checkboxes__input"
                           type="checkbox" id="search-description"
                           ${state.whereToSearch.description ? 'checked' : ''}/>
                    <label class="kg-label kg-checkboxes__label">Description</label>
                  </li>
                  <li class="kg-checkboxes__item">
                    <input class="kg-checkboxes__input"
                           type="checkbox" id="search-text"
                           ${state.whereToSearch.text ? 'checked' : ''}/>
                    <label class="kg-label kg-checkboxes__label">Text</label>
                  </li>
                </ul>
              </div>
              <div class="kg-checkboxes">
                <div class="kg-checkboxes__item">
                  <input class="kg-checkboxes__input"
                         type="checkbox" id="case-sensitive"
                         ${state.caseSensitive ? 'checked' : ''}/>
                  <label class="kg-label kg-checkboxes__label">case sensitive</label>
                </div>
              </div>
              <div>
                Max number of results:
                <input class="govuk-input govuk-input--width-10" id="nb-results" type="number" value="${state.maxNumberOfResultsRequested}"/>
              </div>
              <p class="govuk-body">
                <button
                    class="govuk-button ${state.waiting?'govuk-button--secondary':''}"
                    id="keyword-search">
                  ${state.waiting?'Searching...':'Search'}
                </button>
              </p>
            </div>
      `);
      break;
      case 'contentid-search':
      html.push(`
            <p>Enter one or more contentIDs:</p>
            <div class="govuk-form-group" id="contentid-search-panel">
              <p class="govuk-body">
                <textarea class="govuk-textarea" rows="5" id="contentid">${state.contentIds}</textarea>
              </p>
              <p class="govuk-body">
                <button
                    class="govuk-button ${state.waiting?'govuk-button--secondary':''}"
                    id="contentid-search">
                  ${state.waiting?'Searching...':'Search'}
                </button>
              </p>
            </div>
      `);
      break;
      case 'external-search':
      html.push(`
            <p>Enter an external URL to find all pages linking to it</p>
            <div class="govuk-form-group" id="external-search-panel">
              <p class="govuk-body">
                <input class="govuk-input govuk-input--width-20" id="external"
                       value="${state.externalUrl}"
                       placeholder="eg: youtu.be"/>
              </p>
              <p class="govuk-body">
                <button
                    class="govuk-button ${state.waiting?'govuk-button--secondary':''}"
                    id="external-search">
                  ${state.waiting?'Searching...':'Search'}
                </button>
              </p>
            </div>
      `);
      break;
      case 'link-search':
      html.push(`
            <p>Enter a URL to find all pages linking to it</p>
            <div class="govuk-form-group" id="link-search-panel">
              <p class="govuk-body">
                <input class="govuk-input" id="link-search"
                       value="${state.linkSearchUrl}"
                       placeholder="eg: /benefits"/>
              </p>
              <p class="govuk-body">
                <button
                    class="govuk-button ${state.waiting?'govuk-button--secondary':''}"
                    id="link-search">
                  ${state.waiting?'Searching...':'Search'}
                </button>
              </p>
            </div>
      `);
      break;
      default:
        console.log('invalid mode', state.activeMode);
    }
  } else {
  html.push(`
      </div>
      <div id="results">${viewSearchResults(state.activeMode, state.searchResults, state.showFields)}</div>
    </main>
  `);
  }

  id('page-content').innerHTML = html.join('');

  // adding onclick doesn't work
  document.querySelectorAll('button, input[type=checkbox][data-interactive=true]')
    .forEach(input => input.addEventListener(
      'click',
      event => handleEvent({type: 'dom', id: event.target.getAttribute('id')})));
};


const viewExternalSearchResultsTable = function(records, showFields) {
  const html = [];
  html.push(`<table class="govuk-table">
    <tbody class="govuk-table__body">`);
  html.push(`<tr class="govuk-table__row"><th scope="row" class="govuk-table__header">Title</th>`);
  if (showFields.documentType) html.push('<th scope="row" class="govuk-table__header">External URL</th>');
  html.push(`</tr>`);

  records.forEach(record => {
    let dict = {};
    record.keys.forEach((key, index) => dict[key] = record._fields[index]);

    html.push(`<tr class="govuk-table__row">
      <td class="govuk-table__cell"><a href="${dict.url}">${dict.title}</a></td>
      <td class="govuk-table__cell">${dict.externalUrl}</td>
    </tr>`);
  });
  html.push('</tbody></table>');
  return html.join('');
};

const viewLinkSearchResultsTable = function(records, showFields) {
  const html = [];
  html.push(`<table class="govuk-table">
    <tbody class="govuk-table__body">`);
  html.push(`<tr class="govuk-table__row"><th scope="row" class="govuk-table__header">Title</th>`);
  if (showFields.documentType) html.push('<th scope="row" class="govuk-table__header">URL</th>');
  html.push(`</tr>`);

  records.forEach(record => {
    let dict = {};
    record.keys.forEach((key, index) => dict[key] = record._fields[index]);

    html.push(`<tr class="govuk-table__row">
      <td class="govuk-table__cell"><a href="${dict.url}">${dict.title}</a></td>
      <td class="govuk-table__cell">${dict.slug}</td>
    </tr>`);
  });
  html.push('</tbody></table>');
  return html.join('');
};


const viewSearchResultsTable = function(records, showFields) {
  const html = [];
  html.push('<table class="govuk-table">');
  html.push(`<thead class="govuk-table__head">
      <div id="show-fields-wrapper">
      Show:
        <ul class="kg-checkboxes" id="show-fields" onclick="handleEvent">
          <li class="kg-checkboxes__item">
            <input class="kg-checkboxes__input"
                   data-interactive="true"
                   type="checkbox" id="show-contentid"
                   ${showFields.contentId ? 'checked' : ''}/>
            <label class="kg-label kg-checkboxes__label">content ID</label>
          </li>
          <li class="kg-checkboxes__item">
            <input class="kg-checkboxes__input"
                   data-interactive="true"
                   type="checkbox" id="show-doctype"
                   ${showFields.documentType ? 'checked' : ''}/>
            <label class="kg-label kg-checkboxes__label">Document type</label>
          </li>
          <li class="kg-checkboxes__item">
            <input class="kg-checkboxes__input"
                   data-interactive="true"
                   type="checkbox" id="show-publishingapp"
                   ${showFields.publishingApp ? 'checked' : ''}/>
            <label class="kg-label kg-checkboxes__label">Publishing app</label>
          </li>
          <li class="kg-checkboxes__item">
            <input class="kg-checkboxes__input"
                   data-interactive="true"
                   type="checkbox" id="show-firstpublished"
                   ${showFields.firstPublished ? 'checked' : ''}/>
            <label class="kg-label kg-checkboxes__label">First published</label>
          </li>
          <li class="kg-checkboxes__item">
            <input class="kg-checkboxes__input"
                   data-interactive="true"
                   type="checkbox" id="show-lastupdated"
                   ${showFields.lastUpdated ? 'checked' : ''}/>
            <label class="kg-label kg-checkboxes__label">Last Updated</label>
          </li>
        </ul>
      </div>
    </thead>
    <tbody class="govuk-table__body">`);
  html.push(`<tr class="govuk-table__row"><th scope="row" class="govuk-table__header">Title</th>`);
  if (showFields.contentId) html.push('<th scope="row" class="govuk-table__header">ContentID</th>');
  if (showFields.documentType) html.push('<th scope="row" class="govuk-table__header">Type</th>');
  if (showFields.publishingApp) html.push('<th scope="row" class="govuk-table__header">Publishing app</th>');
  if (showFields.firstPublished) html.push(
    '<th scope="row" class="govuk-table__header">First published</th>'
  );
  if (showFields.lastUpdated) html.push(
    '<th scope="row" class="govuk-table__header">Last updated</th>'
  );
  html.push(`</tr>`);

  records.forEach(record => {
    let dict = {};
    record.keys.forEach((key, index) => dict[key] = record._fields[index]);

    html.push(`<tr class="govuk-table__row"><td class="govuk-table__cell"><a href="${dict.url}">${dict.title}</a></td>`);
    if (showFields.contentId) html.push(`<td class="govuk-table__cell">${dict.contentID}</td>`);
    if (showFields.documentType) html.push(`<td class="govuk-table__cell">${dict.documentType}</td>`);
    if (showFields.publishingApp) html.push(`<td class="govuk-table__cell">${dict.publishingApp}</td>`);
    if (showFields.firstPublished) html.push(`
      <td class="govuk-table__cell">
        ${dict.firstPublished.slice(0,-7).replace(' ', '<br/>')}
      </td>
    `);
    if (showFields.lastUpdated) html.push(`
      <td class="govuk-table__cell">
        ${dict.lastUpdated.slice(0,-7).replace(' ', '<br/>')}
      </td>
    `);
    html.push('</tr>');
  });
  html.push('</tbody></table>');
  return html.join('');
}


const csvFromResults = function(searchResults) {
  const csv = [];
  if (searchResults && searchResults.records.length > 0) {
    csv.push(searchResults.records[0].keys.join()); // heading
    searchResults.records.forEach(record => {
      const line = [];
      record._fields.forEach(field => {
        if (field) {
          field = field.toString();
          if (field.includes(',')) {
            field = `"${field.replace('"', '""')}"`;
          } else {
            if (field.includes('"')) {
              field = '"' + field.replace('"', '""') + '"';
            }
          }
        } else {
          field = '';
        }
        line.push(field);
      });
      csv.push(line.join());
    });
  }
  return csv.join('\n');
};


const viewSearchResults = function(mode, results, showFields) {
  const html = [];
  if (results && results.records.length > 0) {
    html.push(`<h2 class="govuk-heading-m">${results.records.length} results found</h2>`);
    html.push('<div><button class="govuk-button" id="clear">Back</button> ');

    const csv = csvFromResults(results);
    const file = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(file); // TODO: use window.URL.revokeObjectURL(url);  after
    html.push(`<a class="govuk-link" href="${url}" download="export.csv">Export as CSV</a></div>`);

    switch(mode) {
    case 'keyword-search':
    case 'contentid-search':
      html.push(viewSearchResultsTable(results.records, showFields));
      break;
    case 'external-search':
      html.push(viewExternalSearchResultsTable(results.records, showFields));
      break;
    case 'link-search':
      html.push(viewLinkSearchResultsTable(results.records, showFields));
      break;
    default:
      console.log('unknown mode', mode);
    }
  } else {
    html.push('<h2 class="govuk-heading-m">No results</h2>');
    html.push('<div><button class="govuk-button" id="clear">Back</button></div>');
  }

  if (state.searchQuery) {
    html.push(`
      <div id="cypher-query">
      <hr/><h2 class="govuk-heading-s">Cypher query used:</h2>
      <pre>${state.searchQuery}</pre>
    `);
  }

  if(results && results.records.length > 0) {
    html.push(`
    <div id="raw-results">
      <hr/><h2 class="govuk-heading-s">Raw results:</h2>
      <pre>${csvFromResults(state.searchResults)}</pre>
    </div>
  `);
  }


  return html.join('');
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
    n.public_updated_at AS lastUpdated
  `;
};

const buildQuery = function(fields, keywords, exclusions, operator, caseSensitive) {
  const fieldsToSearch = [
    fields.title?'title':null,
    fields.description?'description':null,
    fields.text?'text':null
  ].filter(item => item)

  const inclusionClause = 'WHERE\n' +
    keywords
//      .map(word => `((n.title =~ '(?i).*\\\\b${word}\\\\b.*') OR (n.description =~ '(?i).*\\\\b${word}\\\\b.*') OR (n.text =~ '(?i).*\\\\b${word}\\\\b.*'))`)
      .map(word => multiContainsClause(fieldsToSearch, word, caseSensitive))
      .join(`\n ${operator} `);
  const exclusionClause = exclusions.length ?
    ('WITH * WHERE NOT ' + exclusions.map(word => multiContainsClause(fieldsToSearch, word, caseSensitive)).join(`\n OR `)) : '';

  return `MATCH
(n:Cid)-[r:HAS_PRIMARY_PUBLISHING_ORGANISATION]->(o:Organisation)
MATCH
(n:Cid)-[:HAS_ORGANISATIONS]->(o2:Organisation)
${inclusionClause}
${exclusionClause}
RETURN
${returnFields()},
COLLECT
(o.name) AS primary_organisation,
COLLECT
(o2.name) AS all_organisations, n.pagerank AS popularity
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
      state.neo4jDriver = neo4j.driver(state.server, neo4j.auth.basic(state.user, state.password));
      state.neo4jSession = state.neo4jDriver.session();
      state.errorText = null;
    }).catch(error => {
      console.warn(error);
      state.errorText('Failed to retrieve credentials to connect to the Knowledge Graph');
    });
};


//==================================================
// START
//==================================================


(async () => {
  await init();
  view();
})();
