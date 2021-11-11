/* global neo4j, makeViz */

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
  activeMode: 'keyword-search', // or 'contentid-search'
  waiting: false // whether we're waiting for a request to return
};


const contentIdSearchButtonClicked = function() {
  const contentIds = state.contentIds
    .split(/[^a-zA-Z0-9-]+/)
    .filter(d=>d.length>0)
    .map(s => s.toLowerCase());
  const whereStatement = contentIds.map(cid => `n.contentID="${cid}" `).join(' OR ');
  state.searchQuery = `match (n:Cid) where ${whereStatement} return
    "https://www.gov.uk"+n.name AS url,
    n.name AS slug,
    n.title,
    n.documentType,
    n.contentID,
    n.publishing_app,
    n.first_published_at AS first_published_at,
    n.public_updated_at AS last_updated`;
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
    }
  } else {
  html.push(`
      </div>
      <div id="results">${viewSearchResults(state.searchResults)}</div>
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




const id = x => document.getElementById(x);

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

  console.log(caseSensitive)

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
ORDER BY n.pagerank DESC;`
};


const viewSearchResults = function(results) {
  const html = [];
  if (results) {
    html.push('<div><button class="govuk-button" id="clear">Back</button></div>');
    html.push('<table class="govuk-table">');
    html.push(`<thead class="govuk-table__head">
      <h2 class="govuk-heading-m">${results.records.length} results</h2>
      <div id="show-fields-wrapper">
      Show:
        <ul class="kg-checkboxes" id="show-fields" onclick="handleEvent">
          <li class="kg-checkboxes__item">
            <input class="kg-checkboxes__input"
                   data-interactive="true"
                   type="checkbox" id="show-contentid"
                   ${state.showFields.contentId ? 'checked' : ''}/>
            <label class="kg-label kg-checkboxes__label">content ID</label>
          </li>
          <li class="kg-checkboxes__item">
            <input class="kg-checkboxes__input"
                   data-interactive="true"
                   type="checkbox" id="show-doctype"
                   ${state.showFields.documentType ? 'checked' : ''}/>
            <label class="kg-label kg-checkboxes__label">Document type</label>
          </li>
        </ul>
      </div>
    </thead>
    <tbody class="govuk-table__body">`);
    html.push(`<tr class="govuk-table__row"><th scope="row" class="govuk-table__header">Title</th>`);
    if (state.showFields.contentId) html.push('<th scope="row" class="govuk-table__header">ContentID</th>');
    if (state.showFields.documentType) html.push('<th scope="row" class="govuk-table__header">Type</th>');
    html.push(`</tr>`);


    results.records.forEach(record => {
      let dict = {};
      record.keys.forEach((key, index) => dict[key] = record._fields[index]);

      html.push(`<tr class="govuk-table__row"><td class="govuk-table__cell"><a href="${dict.url}">${dict['n.title']}</a></td>`);
      if (state.showFields.contentId) html.push(`<td class="govuk-table__cell">${dict['n.contentID']}</td>`);
      if (state.showFields.documentType) html.push(`<td class="govuk-table__cell">${dict['n.documentType']}</td>`);
      html.push('</th>');
    });

    html.push('</tbody></table>');
  }

  if (state.searchQuery) {
    html.push('<h2 class="govuk-heading-s">Cypher query:</h2>');
    html.push(`<pre>${state.searchQuery}</pre>`);
  }

  return html.join('');
};



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

(async () => {
  await init();
  view();
})();
