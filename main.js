/* global neo4j, makeViz */

const id = x => document.getElementById(x);


//==================================================
// STATE
//==================================================


const state = {
  user: '',
  password: '',
  server: '',
  statusText: 'starting',
  neo4jSession: null,
  combinator: 'and', // or 'or'
  selectedWords: '',
  excludedWords: '',
  contentIds: '',
  externalUrl: '',
  linkSearchUrl: '',
  searchQuery: null,
  searchResults: null,
  showFields: {
    contentId: true,
    documentType: true
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


const linkSearchButtonClicked = function(url) {
  const justThePath = url.replace(/.*\.gov.uk/, '');
  state.searchQuery = `
    MATCH (t:Cid)<-[HYPERLINKS_TO]-(n:Cid) WHERE t.name="${justThePath}" RETURN
    "https://www.gov.uk"+n.name AS url,
    n.name AS slug,
    n.title,
    n.documentType,
    n.contentID,
    n.publishing_app,
    n.first_published_at AS first_published_at,
    n.public_updated_at AS last_updated
    LIMIT 100`;
  state.neo4jSession.run(state.searchQuery)
    .then(async results => {
      await handleEvent({type:'neo4j-callback-ok', data: results})
    });
};


const externalSearchButtonClicked = function(url) {
  state.searchQuery = `
MATCH (n:Cid) -[:HYPERLINKS_TO]-> (e:ExternalPage)
WHERE e.name CONTAINS "${url}" RETURN
    "https://www.gov.uk"+n.name AS url,
    n.name AS slug,
    n.title,
    n.documentType,
    n.contentID,
    n.publishing_app,
    n.first_published_at AS first_published_at,
    n.public_updated_at AS last_updated,
    e.name
    LIMIT 100`;
  state.neo4jSession.run(state.searchQuery)
    .then(async results => {
      await handleEvent({type:'neo4j-callback-ok', data: results})
    });
};


const contentIdSearchButtonClicked = function() {
  const contentIds = state.contentIds
    .split(/[^a-zA-Z0-9-]+/)
    .filter(d=>d.length>0)
    .map(s => s.toLowerCase());
  const whereStatement = contentIds.map(cid => `n.contentID="${cid}" `).join(' OR ');
  state.searchQuery = `MATCH (n:Cid) WHERE ${whereStatement} RETURN
    "https://www.gov.uk"+n.name AS url,
    n.name AS slug,
    n.title,
    n.documentType,
    n.contentID,
    n.publishing_app,
    n.first_published_at AS first_published_at,
    n.public_updated_at AS last_updated
    LIMIT 100`;
  state.neo4jSession.run(state.searchQuery)
    .then(async results => {
      await handleEvent({type:'neo4j-callback-ok', data: results})
    });
};


const searchButtonClicked = function() {
  if (state.selectedWords.length < 3) {
    state.statusText = 'Word too short';
    return;
  }

  const keywords = state.selectedWords
    .split(/[,;\s]+/)
    .filter(d=>d.length>0);

  const excludedKeywords = state.excludedWords
    .split(/[,;\s]+/)
    .filter(d=>d.length>0)
    .map(s => s.toLowerCase());

  state.searchQuery = buildQuery(state.whereToSearch, keywords, excludedKeywords, state.combinator, state.caseSensitive);
  state.neo4jSession.run(state.searchQuery)
    .then(async results => {
      await handleEvent({type:'neo4j-callback-ok', data: results})
    });
};


const handleEvent = async function(event) {
  switch(event.type) {
    case "dom":
      switch(event.id) {
      case "keyword-search":
        state.selectedWords = id('keyword').value;
        state.excludedWords = id('excluded-keyword').value;
        state.combinator = id('and-or').selectedIndex == 0 ? 'AND' : 'OR';
        state.whereToSearch.title = id('search-title').checked;
        state.whereToSearch.description = id('search-description').checked;
        state.whereToSearch.text = id('search-text').checked;
        state.caseSensitive = id('case-sensitive').checked;
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
  case 'neo4j-callback-ok': // non-dom event
    state.searchResults = event.data;
    state.waiting = false;
  break;
  default:
    console.log('unknown event', event);
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
      <h1 class="govuk-heading-xl">Search the Knowledge Graph</h1>`);

  if (state.statusText) {
    html.push(`<p class="govuk-body"><span>Status: </span>${state.statusText}</p>`);
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
                <input class="govuk-input govuk-input--width-20" id="keyword" placeholder="eg: cat dog ferret" value="${state.selectedWords}"/>

              <br/>but not:

                <input class="govuk-input govuk-input--width-20" id="excluded-keyword" placeholder="leave blank if no exclusions" value="${state.excludedWords}"/>
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
            <p>Enter one of multiple contentIDs:</p>
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
      <td class="govuk-table__cell"><a href="${dict.url}">${dict['n.title']}</a></td>
      <td class="govuk-table__cell">${dict['e.name']}</td>
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
      <td class="govuk-table__cell"><a href="${dict.url}">${dict['n.title']}</a></td>
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
        </ul>
      </div>
    </thead>
    <tbody class="govuk-table__body">`);
  html.push(`<tr class="govuk-table__row"><th scope="row" class="govuk-table__header">Title</th>`);
  if (showFields.contentId) html.push('<th scope="row" class="govuk-table__header">ContentID</th>');
  if (showFields.documentType) html.push('<th scope="row" class="govuk-table__header">Type</th>');
  html.push(`</tr>`);

  records.forEach(record => {
    let dict = {};
    record.keys.forEach((key, index) => dict[key] = record._fields[index]);

    html.push(`<tr class="govuk-table__row"><td class="govuk-table__cell"><a href="${dict.url}">${dict['n.title']}</a></td>`);
    if (showFields.contentId) html.push(`<td class="govuk-table__cell">${dict['n.contentID']}</td>`);
    if (showFields.documentType) html.push(`<td class="govuk-table__cell">${dict['n.documentType']}</td>`);
    html.push('</tr>');
  });
  html.push('</tbody></table>');
  return html.join('');
}


const csvFromResults = function(searchResults) {

  const csv = []
  console.log(searchResults.records)

  csv.push(searchResults.records[0].keys.join()); // heading

  searchResults.records.forEach(record => {
    const line = [];
    record._fields.forEach(field => {
      field = field.toString();
      if (field.includes(',')) {
        field = `"${field.replace('"', '""')}"`;
      } else {
        if (field.includes('"')) {
          field = '"' + field.replace('"', '""') + '"';
        }
      }
      line.push(field);
    });
    csv.push(line.join());
  });
  return csv.join('\n');
};


const viewSearchResults = function(mode, results, showFields) {
  const html = [];
  if (results && results.records.length > 0) {
    html.push(`<h2 class="govuk-heading-m">${results.records.length} results found</h2>`);
    html.push('<div><button class="govuk-button" id="clear">Back</button> ');

    const csv = csvFromResults(state.searchResults);
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

  html.push(`
    <div id="raw-results">
      <hr/><h2 class="govuk-heading-s">Raw results:</h2>
      <pre>${csvFromResults(state.searchResults)}</pre>
    </div>
  `);


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
"https://www.gov.uk"+n.name AS url,
n.name AS slug,
n.title,
n.documentType,
n.contentID,
n.publishing_app,
n.first_published_at AS first_published_at,
n.public_updated_at AS last_updated,
COLLECT
(o.name) AS primary_organisation,
COLLECT
(o2.name) AS all_organisations, n.pagerank AS popularity
ORDER BY n.pagerank DESC
LIMIT 100;`
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
      state.statusText = 'starting session';
      state.neo4jSession = state.neo4jDriver.session();
      state.statusText = null;
    }).catch(error => {
      console.warn(error);
      state.statusText('failed to retrieve credentials');
    });
};


//==================================================
// START
//==================================================


(async () => {
  await init();
  view();
})();
