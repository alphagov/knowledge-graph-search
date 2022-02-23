/* global accessibleAutocomplete */
/*eslint no-unused-vars: ["error", { "varsIgnorePattern": "view" }]*/

import { id, sanitise } from './utils.js';
import { state } from './state.js';
import { handleEvent } from './events.js';

const view = function() {
  const html = [];
  html.push(`
    <main class="govuk-main-wrapper " id="main-content" role="main">
      <h1 class="govuk-heading-xl">Search the GovGraph</h1>
      <h2 class="govuk-heading-m">New (22/2/22): share your search by copying the URL</h2>
      <h2 class="govuk-heading-m">New (22/2/22): the browser back button now works</h2>

`);

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
                <input class="govuk-input govuk-input--width-20" id="keyword" placeholder="eg: cat dog &quot;health certificate&quot;" value='${sanitise(state.selectedWords).replace('"', '&quot;')}'/>

              <br/>but not:

                <input class="govuk-input govuk-input--width-20" id="excluded-keyword" placeholder="leave blank if no exclusions" value='${sanitise(state.excludedWords).replace('"', '&quot;')}'/>
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
                <p class="govuk-body">Search within taxon (and sub-taxons): <span class="experimental">EXPERIMENTAL</span></p>
                <select class="govuk-select" id="taxons">
                  <option name=""}>All taxons</option>
                  ${state.taxons.map(taxon => `<option name="${taxon}" ${state.selectedTaxon === taxon ? 'selected' :''}>${taxon}</option>`)}
                </select>
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
                       placeholder="eg: /maternity-pay-leave"/>
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

  // add the accessible autocomplete
  if (document.querySelector('#taxons')) {
    accessibleAutocomplete.enhanceSelectElement({
      selectElement: document.querySelector('#taxons')
    });
  }

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
          <li class="kg-checkboxes__item">
            <input class="kg-checkboxes__input"
                   data-interactive="true"
                   type="checkbox" id="show-taxons"
                   ${showFields.taxons ? 'checked' : ''}/>
            <label class="kg-label kg-checkboxes__label">Taxons</label>
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
  if (showFields.taxons) html.push(
    '<th scope="row" class="govuk-table__header">Taxons</th>'
  );
  html.push(`</tr>`);

  records.forEach(record => {
    let dict = {};
    record.keys.forEach((key, index) => dict[key] = record._fields[index]);

    html.push(`<tr class="govuk-table__row"><td class="govuk-table__cell"><a href="${dict.url}">${dict.title}</a></td>`);
    if (showFields.contentId) html.push(`<td class="govuk-table__cell">${dict.contentID}</td>`);
    if (showFields.documentType) html.push(`<td class="govuk-table__cell">${dict.documentType.replace('_', ' ')}</td>`);
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
    if (showFields.taxons) html.push(`<td class="govuk-table__cell">${dict.taxons.join(', ')}</td>`);
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

export { view };
