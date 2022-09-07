import { id, splitKeywords } from '../utils.js';
import { state, searchState } from '../state.js';
import { handleEvent } from '../events.js';
import { languageName } from '../lang.js';
import { viewMetaResults } from './view-metabox.js';
import { viewSearchPanel } from './view-search-panel.js';
import { viewFeedbackBanner } from './view-components.js';


const view = () => {
  console.log('view')
  document.title = 'GovGraph search';

  const showPage = Number.isInteger(state.showPageWithIndex) && state.searchResults;

  id('page-content').innerHTML = `
    <main class="govuk-main-wrapper" id="main-content" role="main">
      ${state.displayFeedbackBanner ? viewFeedbackBanner() : ''}
      <div class="govuk-grid-row">
        <div class="govuk-grid-column-two-thirds">
          <h1 class="govuk-heading-xl main-title">
            GovGraph Search
          </h1>
          ${showPage ? '' : `${viewSearchTypeSelector()}${viewErrorBanner()}`}
       </div>
      </div>
      ${showPage ? viewPageDetails() : viewMainLayout()}
    </main>
  `;

  // Add event handlers
  document.querySelectorAll('#dismiss-feedback-banner, button, input[type=checkbox][data-interactive=true]')
    .forEach(input => input.addEventListener(
      'click',
      event => handleEvent({type: 'dom', id: event.target.getAttribute('id')})));

  // Not sure this is even fired, since browser blocks submit because "the form is not connected"
  id('search-form')?.addEventListener(
    'submit',
    event => {
      event.preventDefault();
      // Tell GTM the form was submitted
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        'event': 'formSubmission',
        'formType': 'Search',
        'formPosition': 'Page'
      });
      handleEvent({type: 'dom', id: 'search'});
    });


  id('meta-results-expand')?.addEventListener(
    'click',
    () => handleEvent({type: 'dom', id: 'toggleDisamBox'})
  );

  // focus on the results heading if present
  id('results-heading')?.focus();

};


const viewPageDetails = () => {
  const pageData = state.searchResults[state.showPageWithIndex + state.skip];
  return `
    <h1 class="govuk-heading-l">${pageData.title}</h1>
    <ul class="govuk-list--bullet">
      ${Object.keys(pageData).map(key => `<li>${fieldName(key)}: ${fieldFormat(key, pageData[key])}</li>`).join('')}
    </ul>
    <button class="govuk-button" id="close-page-button">Back to results</button>
  `;
};


const viewSearchTypeSelector = () => `
    <p class="govuk-body search-selector">
      Search for:
      <button class="${state.searchType === 'keyword' ? 'active' : '' }" id="search-keyword">Keywords</button>
      <button class="${state.searchType === 'link' ? 'active' : '' }" id="search-link">Links</button>
      <button class="${state.searchType === 'taxon' ? 'active' : '' }" id="search-taxon">Taxons</button>
      <button class="${state.searchType === 'language' ? 'active' : '' }" id="search-language">Languages</button>
      <button class="${state.searchType === 'mixed' ? 'active' : '' }" id="search-mixed">Mixed</button>
    </p>
  `;


const viewMainLayout = () => {
  if (state.searchType === 'mixed') {
    if (!state.searchResults) {
      return `
        <div class="govuk-grid-row">
          <div class="govuk-grid-column-two-thirds">
            ${viewSearchPanel(state.searchType)}
          </div>
        </div>`;
    } else {
      return `
        <div class="govuk-grid-row mixed-layout">
          <div class="govuk-grid-column-one-third">
            ${viewSearchPanel(state.searchType)}
          </div>
          <div class="govuk-grid-column-two-thirds">
            ${viewSearchResults()}
          </div>
        </div>`;
    }
  } else {
    return `
      <div class="govuk-grid-row">
        <div class="govuk-grid-column-two-thirds">
          ${viewSearchPanel(state.searchType)}
        </div>
      </div>
      ${viewSearchResults()}
    `;
  }
};


const makeBold = (text, includeMarkup) =>
  includeMarkup ?
    `<span class="govuk-!-font-weight-bold">${text}</span>` :
    `"${text}"`;


const viewContainDescription = (includeMarkup) => {
  let where;
  if (state.whereToSearch.title && state.whereToSearch.text) {
    where = '';
  } else if (state.whereToSearch.title) {
    where = 'in their title';
  } else {
    where = 'in their body content';
  }
  let combineOp = state.combinator === 'all' ? 'and' : 'or';
  let combinedWords = splitKeywords(state.selectedWords)
    .map(w=>makeBold(w, includeMarkup))
    .join(` ${combineOp} `);
  return state.selectedWords !== '' ? `${combinedWords} ${where}` : '';
};


const viewQueryDescription = (includeMarkup = true) => {
  const clauses = [];
  if (state.selectedWords !== '') {
    let keywords = `contain ${viewContainDescription(includeMarkup)}`;
    if (state.excludedWords !== '') {
      keywords = `${keywords} (but don't contain ${makeBold(state.excludedWords, includeMarkup)})`;
    }
    clauses.push(keywords);
  }
  if (state.selectedTaxon !== '')
    clauses.push(`belong to the ${makeBold(state.selectedTaxon, includeMarkup)} taxon (or its sub-taxons)`);
  if (state.selectedLocale !== '')
    clauses.push(`are in ${makeBold(languageName(state.selectedLocale), includeMarkup)}`);
  if (state.linkSearchUrl !== '')
    clauses.push(`link to ${makeBold(state.linkSearchUrl, includeMarkup)}`);
  if (state.areaToSearch === 'whitehall' || state.areaToSearch === 'mainstream')
    clauses.push(`are published using ${makeBold(state.areaToSearch, includeMarkup)}`);

  const joinedClauses = (clauses.length === 1) ?
    clauses[0] :
    `${clauses.slice(0, clauses.length - 1).join(', ')} and ${clauses[clauses.length - 1]}`;

  return `pages that ${joinedClauses}, in descending popularity`;
};



const viewErrorBanner = () => {
  const html = [];
  if (state.errorText || state.userErrors) {
    html.push(`
      <div class="govuk-error-summary" aria-labelledby="error-summary-title" role="alert" tabindex="-1" data-module="govuk-error-summary">`);

    if (state.errorText) {
      html.push(`
        <h2 class="govuk-error-summary__title" id="error-summary-title">System error</h2>
        <p class="govuk-body">${state.errorText}</p>
      `);
    } else {
      if (state.userErrors) {
        html.push(`
          <h2 class="govuk-error-summary__title" id="error-summary-title">
            There is a problem
          </h2>
          <ul class="govuk-error-summary__list">
        `);
        state.userErrors.forEach(userError => {
          switch (userError) {
            case 'missingWhereToSearch':
            html.push(`
            <li><a href="#search-locations-wrapper">You need to select a keyword location</a></li>`);
            break;
            case 'missingArea':
            html.push(`
            <li><a href="#search-scope-wrapper">You need to select a publishing application</a></li>`);
            break;
            default:
            console.log('unknown user error code:', userError);
          }
        });
        html.push(`
          </ul>`);
      }
    }
    html.push(`
      </div>
    `);
  }
  return html.join('');
};


const viewSearchResultsTable = () => {
  const html = [];
  const recordsToShow = state.searchResults.slice(state.skip, state.skip + state.resultsPerPage);
  html.push(`
    <div class="govuk-body">
      <table id="results-table" class="govuk-table">
        <tbody class="govuk-table__body">
          <tr class="govuk-table__row">
            <th scope="col" class="a11y-hidden">Page</th>
            <th scope="col" class="govuk-table__header">Page title</th>
            <th scope="col" class="govuk-table__header"></th>
          </tr>
    `);

  recordsToShow.forEach((record, recordIndex) => {
    html.push(`
          <tr class="govuk-table__row">
            <th class="a11y-hidden">${recordIndex}</th>
            <td class="govuk-table__cell">
              <a class="govuk-link" href="${record['url']}">${fieldFormat('title', record['title'])}
            </td>
            <td class="govuk-table__cell">
              <button type="button" class="govuk-button" id="page-details-${recordIndex}">Details</button>
            </td>
          </tr>
   `);
  });
  html.push(`
        </tbody>
      </table>
    </div>
  `);
  return html.join('');
};


const csvFromResults = function(searchResults) {
  const csv = [];
  if (searchResults && searchResults.length > 0) {
    // column headings: take them from the first record
    csv.push(Object.keys(searchResults[0]).map(fieldName).join())
    // rows:
    searchResults.forEach(record => {
      const line = [];
      Object.values(record).forEach(field => {
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


const viewWaiting = () => `
  <div class="govuk-body">Searching for ${viewQueryDescription()}</div>
  <p class="govuk-body-s">Please note that some queries take up to one minute</p>
`;


const viewResults = function() {
  const html = [];
  const nbRecords = state.searchResults.length;

/*
  if (state.metaSearchResults.length > 0) {
    const names = state.metaSearchResults.map(result => result.name);
    const uniqueNames = names.filter((v,i,a) => a.indexOf(v) === i);
    if (uniqueNames.length === 1) {
      html.push(viewMetaResults());
    }
  }
*/

  if (nbRecords < state.nbResultsLimit) {
    html.push(`
      <h2 tabindex="0" id="results-heading" class="govuk-heading-l">${nbRecords} result${nbRecords!==0 ? 's' : ''}</h2>`);
  } else {
    html.push(`
      <div class="govuk-warning-text">
        <span class="govuk-warning-text__icon" aria-hidden="true">!</span>
        <strong class="govuk-warning-text__text">
          <span class="govuk-warning-text__assistive">Warning</span>
          There are more than ${state.nbResultsLimit} results. Try to narrow down your search.
        </strong>
      </div>
    `);
  }

  html.push(`<div class="govuk-body">for ${viewQueryDescription()}</div>`);

  if (nbRecords >= state.resultsPerPage) {
    html.push(`
      <p class="govuk-body">Showing results ${state.skip + 1} to ${Math.min(nbRecords, state.skip + state.resultsPerPage)}</p>
      <a class="govuk-skip-link" href="#results-table">Skip to results</a>
      <a class="govuk-skip-link" href="#search-form">Back to search filters</a>
`);
  }
  html.push(viewSearchResultsTable());

  if (nbRecords >= state.resultsPerPage) {
    html.push(`
      <p class="govuk-body">
        <button type="button" class="govuk-button" id="button-prev-page">Previous</button>
        <button type="button" class="govuk-button" id="button-next-page">Next</button>
      </p>`);
  }

  const csv = csvFromResults(state.searchResults);
  const file = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(file); // TODO: use window.URL.revokeObjectURL(url);  after
  html.push(`
      <p class="govuk-body"><a class="govuk-link" href="${url}" download="export.csv">Download all ${state.searchResults.length} records in CSV</a></p>`);
  return html.join('');
};


const viewNoResults = () => {
  return `
    <h2 tabindex="0" id="results-heading" class="govuk-heading-l">No results</h2>
    <div class="govuk-body">for ${viewQueryDescription()}</div>
  `;
};


const viewSearchResults = () => {
  switch (searchState().code) {
  case 'waiting':
    document.title = `GOV.UK ${viewQueryDescription(false)} - GovGraph search`;
    return viewWaiting();
  case 'results':
    document.title = `GOV.UK ${viewQueryDescription(false)} - GovGraph search`;
    return `${viewMetaResults() || ''} ${viewResults()}`; // FIXME - avoid || ''
  case 'no-results':
    document.title = `GOV.UK ${viewQueryDescription(false)} - GovGraph search`;
    return `${viewMetaResults() || ''} ${viewNoResults()}`; // FIXME - avoid || ''
  default:
    document.title = 'GovGraph search';
    return '';
  }
};


// Remove duplicates - but should be fixed in cypher
const formatNames = array => [...new Set(array)].map(x => `"${x}"`).join(', ');


const formatDateTime = date => `${date.slice(0,10)} at ${date.slice(12, 16)}`;


const fieldFormatters = {
  'url' : {
    name: 'URL',
    format: url => `<a class="govuk-link" href="${url}">${url}</a>`
  },
  'title': { name: 'Title' },
  'locale': { name: 'Language', format: languageName },
  'documentType': { name: 'Document type' },
  'publishing_app': { name: 'Publishing app' },
  'first_published_at' : {
    name: 'First published',
    format: formatDateTime
  },
  'public_updated_at' : {
    name: 'Last major update',
    format: formatDateTime,
  },
  'taxons' : {
    name: 'Taxons',
    format: formatNames
  },
  'primary_organisation' : {
    name: 'Primary publishing organisations',
    format: formatNames
  },
  'all_organisations' : {
    name: 'All publishing organisations',
    format: formatNames
  },
  'pagerank' : {
    name: 'Popularity',
    format: val => val.toFixed(2)
  },
  'withdrawn_at' : {
    name: 'Withdrawn at',
    format: date => date ? formatDateTime(date) : "not withdrawn"
  },
  'withdrawn_explanation' : {
    name: 'Withdrawn reason',
    format: text => text || 'n/a'
  }
};


const fieldName = function(key) {
  const f = fieldFormatters[key];
  return f ? f.name : key;
};


const fieldFormat = function(key, val) {
  const f = fieldFormatters[key];
  return (f && f.format) ? f.format(val) : val;
};


export { view };
