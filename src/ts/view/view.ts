import { id, keywordQueryDescription, linkQueryDescription } from '../utils';
import { state, searchState, thereAreResults } from '../state';
import { handleEvent } from '../events';
import { languageName } from '../lang';
import {
  viewPerson,
  viewOrganisation,
  viewBankHoliday,
  viewTaxon,
  viewRole,
  viewTransaction
 } from './view-metabox';
import { viewSearchPanel, viewKeywordsInput, viewSearchButton } from './view-search-panel';
import { EventType } from '../event-types';
import { SearchResults } from '../search-api-types';


declare const window: any;


const view = () => {
  console.log('view')
  document.title = 'Gov Search';
  const pageContent: (HTMLElement | null) = id('page-content');
  if (pageContent) {
    pageContent.innerHTML = `
      <main class="govuk-main-wrapper" id="main-content" role="main">
        ${viewErrorBanner()}
        ${viewMainLayout()}
        <p class="govuk-body-s">
          Searches do not include history mode content, Publisher GitHub smart answers or service domains.
          Page views depend on cookie consent.
        </p>
      </main>
    `;
  }

  // Add event handlers
  document.querySelectorAll('button, input[type=checkbox][data-interactive=true]')
    .forEach(input => input.addEventListener(
      'click',
      event => handleEvent({ type: EventType.Dom, id: (event.target as HTMLElement).getAttribute('id') || undefined })));

  document.querySelectorAll('span.govuk-tabs__tab').forEach(tab =>
    tab.addEventListener(
      'click',
      event => handleEvent({ type: EventType.Dom, id: (event.target as HTMLElement).getAttribute('data-target') || undefined })));

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
      handleEvent({ type: EventType.Dom, id: 'search' });
    });

  // focus on the results heading if present
  id('results-heading')?.focus();
};


const viewMainLayout = () => {
  const result = [];
  if (state.searchParams.searchType === 'advanced') {
    if (!state.searchResults) {
      result.push(`
        <div class="govuk-grid-row advanced-layout--no-results">
          <div class="govuk-grid-column-two-thirds">
            ${viewSearchPanel()}
          </div>
        </div>
      `);
    } else {
      result.push(`
        <div class="govuk-grid-row advanced-layout">
          <div class="govuk-grid-column-one-third">
            ${viewSearchPanel()}
          </div>
          <div class="govuk-grid-column-two-thirds">
            ${viewSearchResults()}
          </div>
        </div>
      `);
    }
  } else {
    result.push(`
      <div class="govuk-grid-row simple-search">
        <div class="govuk-grid-column-two-thirds">
          ${viewSearchPanel()}
        </div>
        <div class="govuk-grid-column-two-thirds">
          ${viewSearchResults()}
        </div>
      </div>
    `);
  }
  return html.join('');
};


const viewErrorBanner = () => {
  const html = [];
  if (state.systemErrorText || state.userErrors.length > 0) {
    html.push(`
        <div class="govuk-error-summary" aria-labelledby="error-summary-title" role="alert" tabindex="-1" data-module="govuk-error-summary">`);
    if (state.systemErrorText) {
      let errorText: string = '';
      switch (state.systemErrorText) {
        case 'TIMEOUT':
        errorText = "The databse took too long to respond. This is usually due to too many query results. Please try a more precise query.";
        break;
        default:
        errorText = "A problem has occurred with the database.";
      }
      html.push(`
          <h1 class="govuk-error-summary__title" id="error-summary-title">There is a problem</h1>
          <p class="govuk-body">${errorText}</p>
          <p>Please <a class=\"govuk-link\" href=\"mailto:data-products-research@digital.cabinet-office.gov.uk\">contact the Data Products team</a> if the problem persists.</p>
      `);
    } else {
      if (state.userErrors.length > 0) {
        html.push(`
            <h1 class="govuk-error-summary__title" id="error-summary-title">
              There is a problem
            </h1>
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


const viewResultsTable = (results: any[], description: string) => {
  const html = [];
  if (results && results?.length > 0) {
    const recordsToShow = results.slice(state.skip, state.skip + state.resultsPerPage);
    const nbRecords = state.searchResults.keywords.length;
    html.push(`
      <div class="govuk-body">
        <h3 class="govuk-heading-m">${description}</h3>
        <p class="govuk-body">results ${state.skip + 1} to ${Math.min(nbRecords, state.skip + state.resultsPerPage)}, in descending popularity</p>
        <a class="govuk-skip-link" href="#results-table">Skip to results</a>
        <a class="govuk-skip-link" href="#search-form">Back to search filters</a>
        <fieldset class="govuk-fieldset" ${state.waiting && 'disabled="disabled"'}>
          <legend class="govuk-fieldset__legend">For each result, display:</legend>
          <ul class="kg-checkboxes" id="show-fields">`);
    html.push(Object.keys(results[0]).map(key => `
            <li class="kg-checkboxes__item">
              <input class="kg-checkboxes__input"
                     data-interactive="true"
                     type="checkbox" id="show-field-${key}"
                ${state.showFields[key] ? 'checked' : ''}/>
              <label for="show-field-${key}" class="kg-label kg-checkboxes__label">${fieldName(key)}</label>
            </li>`).join(''));
    html.push(`
          </ul>
        </fieldset>
        <table id="results-table" class="govuk-table">
          <tbody class="govuk-table__body">
          <tr class="govuk-table__row">
            <th scope="col" class="a11y-hidden">Page</th>`);
    Object.keys(state.showFields).forEach(key => {
      if (state.showFields[key]) {
        html.push(`<th scope="col" class="govuk-table__header">${fieldName(key)}</th>`);
      }
    });

    recordsToShow.forEach((record, recordIndex) => {
      html.push(`
        <tr class="govuk-table__row">
          <th class="a11y-hidden">${recordIndex}</th>`);
      Object.keys(state.showFields).forEach(key => {
        if (state.showFields[key]) {
          html.push(`<td class="govuk-table__cell">${fieldFormat(key, record[key])}</td>`);
        }
      });
      html.push(`</tr>`);
    });
    html.push(`
          </tbody>
        </table>
      </div>`);
    html.push(`
      <p class="govuk-body">
        <button type="button" class="govuk-button" id="button-prev-page" ${state.skip < state.resultsPerPage ? "disabled" : ""}>Previous</button>
        <button type="button" class="govuk-button" id="button-next-page" ${state.skip + state.resultsPerPage >= results.length ? "disabled" : ""}>Next</button>
      </p>`);
    html.push(`
      <p class="govuk-body"><a class="govuk-link" href="/csv${window.location.search}" download="export.csv">Download all ${state.searchResults.keywords.length} records in CSV</a></p>`);
    return html.join('');
  } else {
    return '';
  }
};


// Add a count of something, possibly including the plural s
// e.g. count('page', 34) will return '34 pages'
// e.g. count('page', 1) will return '1 page'
const count = (thing: string, count: number) =>
  `${count} ${thing}${count>1 ? 's' : ''}`


const viewSearchResultsTabs = (results: SearchResults) => {
  const html = [];

  html.push(`
    <div class="govuk-tabs" data-module="govuk-tabs">
      <h2 class="govuk-tabs__title">
        Contents
      </h2>
      <ul class="govuk-tabs__list">
  `);

  // The actual tabs
  if (results.keywords.length > 0) {
    html.push(`
      <li class="govuk-tabs__list-item ${state.selectedTabId === 'keyword-results' ? 'govuk-tabs__list-item--selected' : ''}">
        <span class="govuk-tabs__tab" data-target="keyword-results">
          ${count('page', state.searchResults.keywords.length)}
        </span>
      </li>
    `);
  }
  if (results.links.length > 0) {
    html.push(`
      <li class="govuk-tabs__list-item ${state.selectedTabId === 'link-results' ? 'govuk-tabs__list-item--selected' : ''}">
        <span class="govuk-tabs__tab" data-target="link-results">
          ${count('link', state.searchResults.links.length)}
        </span>
      </li>
    `);
  }
  if (results.persons.length > 0) {
    html.push(`
      <li class="govuk-tabs__list-item ${state.selectedTabId === 'person-results' ? 'govuk-tabs__list-item--selected' : ''}">
        <span class="govuk-tabs__tab" data-target="person-results">
          ${count('person', state.searchResults.persons.length)}
        </span>
      </li>
    `);
  }
  if (results.organisations.length > 0) {
    html.push(`
      <li class="govuk-tabs__list-item ${state.selectedTabId === 'organisation-results' ? 'govuk-tabs__list-item--selected' : ''}">
        <span class="govuk-tabs__tab" data-target="organisation-results">
          ${count('organisation', state.searchResults.organisations.length)}
        </span>
      </li>
    `);
  }
  if (results.taxons.length > 0) {
    html.push(`
      <li class="govuk-tabs__list-item ${state.selectedTabId === 'taxon-results' ? 'govuk-tabs__list-item--selected' : ''}">
        <span class="govuk-tabs__tab" data-target="taxon-results">
          ${count('taxon', state.searchResults.taxons.length)}
        </span>
      </li>
    `);
  }
  if (results.roles.length > 0) {
    html.push(`
      <li class="govuk-tabs__list-item ${state.selectedTabId === 'role-results' ? 'govuk-tabs__list-item--selected' : ''}">
        <span class="govuk-tabs__tab" data-target="role-results">
          ${count('role', state.searchResults.roles.length)}
        </span>
      </li>
    `);
  }
  if (results.bankHolidays.length > 0) {
    html.push(`
      <li class="govuk-tabs__list-item ${state.selectedTabId === 'bank-holiday-results' ? 'govuk-tabs__list-item--selected' : ''}">
        <span class="govuk-tabs__tab" data-target="bank-holiday-results">
          ${count('bank holiday', state.searchResults.bankHolidays.length)}
        </span>
      </li>
    `);
  }
  if (results.transactions.length > 0) {
    html.push(`
      <li class="govuk-tabs__list-item ${state.selectedTabId === 'transaction-results' ? 'govuk-tabs__list-item--selected' : ''}">
        <span class="govuk-tabs__tab" data-target="transaction-results">
          ${count('online service', state.searchResults.transactions.length)}
        </span>
      </li>
    `);
  }

  html.push(`
    </ul>
  `);

  // The panels

  if (results.keywords.length > 0) {
    html.push(`
      <div id="keyword-results" class="govuk-tabs__panel ${state.selectedTabId === 'keyword-results' ? '' : 'govuk-tabs__panel--hidden'}">
        ${viewResultsTable(results.keywords, keywordQueryDescription(state.searchParams, false))}
      </div>
    `);
  }
  if (results.links.length > 0) {
    html.push(`
      <div id="link-results" class="govuk-tabs__panel ${state.selectedTabId === 'link-results' ? '' : 'govuk-tabs__panel--hidden'}">
        ${viewResultsTable(results.links, linkQueryDescription(state.searchParams, false))}
      </div>
    `);
  }
  if (results.persons.length > 0) {
    html.push(`
      <div id="person-results" class="govuk-tabs__panel ${state.selectedTabId === 'person-results' ? '' : 'govuk-tabs__panel--hidden'}">
        <h1 class="govuk-heading-m">Persons whose name matches: ${state.searchParams.selectedWords}</h1>
        ${results.persons.map(viewPerson).join('<hr class="govuk-section-break govuk-section-break--visible"/>')}
      </div>
    `);
  }
  if (results.organisations.length > 0) {
    html.push(`
      <div id="organisation-results" class="govuk-tabs__panel ${state.selectedTabId === 'organisation-results' ? '' : 'govuk-tabs__panel--hidden'}">
        <h1 class="govuk-heading-m">Organisations whose name matches: ${state.searchParams.selectedWords}</h1>
        ${results.organisations.map(viewOrganisation).join('<hr class="govuk-section-break govuk-section-break--visible"/>')}
      </div>
    `);
  }
  if (results.bankHolidays.length > 0) {
    html.push(`
      <div id="bank-holiday-results" class="govuk-tabs__panel ${state.selectedTabId === 'bank-holiday-results' ? '' : 'govuk-tabs__panel--hidden'}">
        <h1 class="govuk-heading-m">Bank holidays whose name matches: ${state.searchParams.selectedWords}</h1>
        ${results.bankHolidays.map(viewBankHoliday).join('<hr class="govuk-section-break govuk-section-break--visible"/>')}
      </div>
    `);
  }
  if (results.taxons.length > 0) {
    html.push(`
      <div id="taxon-results" class="govuk-tabs__panel ${state.selectedTabId === 'taxon-results' ? '' : 'govuk-tabs__panel--hidden'}">
        <h1 class="govuk-heading-m">GOV.UK taxons whose name matches: ${state.searchParams.selectedWords}</h1>
        ${results.taxons.map(viewTaxon).join('<hr class="govuk-section-break govuk-section-break--visible"/>')}
      </div>
    `);
  }
  if (results.roles.length > 0) {
    html.push(`
      <div id="role-results" class="govuk-tabs__panel ${state.selectedTabId === 'role-results' ? '' : 'govuk-tabs__panel--hidden'}">
        <h1 class="govuk-heading-m">Official roles whose name matches: ${state.searchParams.selectedWords}</h1>
        ${results.roles.map(viewRole).join('<hr class="govuk-section-break govuk-section-break--visible"/>')}
      </div>
    `);
  }
  if (results.transactions.length > 0) {
    html.push(`
      <div id="transaction-results" class="govuk-tabs__panel ${state.selectedTabId === 'transaction-results' ? '' : 'govuk-tabs__panel--hidden'}">
        <h1 class="govuk-heading-m">Online services whose name matches: ${state.searchParams.selectedWords}</h1>
        ${results.transactions.map(viewTransaction).join('<hr class="govuk-section-break govuk-section-break--visible"/>')}
      </div>
    `);
  }

  html.push(`
    </div>
  `);

  return html.join('');
}



const viewWaiting = () => `
  <div aria-live="polite" role="region">
    <div class="govuk-body">Searching for ${keywordQueryDescription(state.searchParams)}</div>
    <p class="govuk-body-s">Some queries may take up to a minute</p>
  </div>
`;


const viewResults = function() {
  const html = [];

  const nbRecords = state.searchResults.keywords.length;

  if (nbRecords > 10000) {
    html.push(`
      <div class="govuk-warning-text">
        <span class="govuk-warning-text__icon" aria-hidden="true">!</span>
        <strong class="govuk-warning-text__text">
          <span class="govuk-warning-text__assistive">Warning</span>
          There are more than 50000 results. Try to narrow down your search.
        </strong>
      </div>
    `);
  }

  html.push(viewSearchResultsTabs(state.searchResults));

  return html.join('');
};


const viewNoResults = (description: string): string => {
  return `
    <h1 tabindex="0" id="results-heading" class="govuk-heading-l">No results</h1>
    <div class="govuk-body">for ${description} </div>
  `;
};


const viewSearchResults = () => {
  switch (searchState().code) {
    case 'waiting':
      document.title = `${keywordQueryDescription(state.searchParams, false)} - Gov Search`;
      return viewWaiting();
    case 'results':
      document.title = `${keywordQueryDescription(state.searchParams, false)} - Gov Search`;
      if (window.ga) window.ga('send', 'search', { search: document.title, resultsFound: true });
      return viewResults();
    case 'no-results':
      document.title = `${keywordQueryDescription(state.searchParams, false)} - Gov Search`;
      if (window.ga) window.ga('send', 'search', { search: document.title, resultsFound: false });
      return viewNoResults(keywordQueryDescription(state.searchParams));
    default:
      document.title = 'Gov Search';
      return '';
  }
};


const formatNames = (array: []) => [...new Set(array)].map(x => `“${x}”`).join(', ');


const formatDateTime = (date: any) =>
  `${date.value.slice(0, 10)} at ${date.value.slice(11, 16)}`;


const fieldFormatters: Record<string, any> = {
  'url': {
    name: 'URL',
    format: (url: string) => `<a class="govuk-link" href="${url}">${url}</a>`
  },
  'title': { name: 'Title' },
  'locale': { name: 'Language', format: languageName },
  'documentType': { name: 'Document type' },
  'publishing_app': { name: 'Publishing app' },
  'first_published_at': {
    name: 'First published',
    format: formatDateTime
  },
  'public_updated_at': {
    name: 'Last major update',
    format: formatDateTime,
  },
  'taxons': {
    name: 'Taxons',
    format: formatNames
  },
  'primary_organisation': {
    name: 'Primary publishing organisation',
    format: (x: string) => x
  },
  'all_organisations': {
    name: 'All publishing organisations',
    format: formatNames
  },
  'page_views': {
    name: 'Page views',
    format: (val: string) => val ? parseInt(val).toString() : '<5'
  },
  'withdrawn_at': {
    name: 'Withdrawn at',
    format: (date: string) => date ? formatDateTime(date) : "not withdrawn"
  },
  'withdrawn_explanation': {
    name: 'Withdrawn reason',
    format: (text: string) => text || 'n/a'
  }
};


const fieldName = function(key: string) {
  const f = fieldFormatters[key];
  return f ? f.name : key;
};


const fieldFormat = function(key: string, val: string | number):string {
  const f = fieldFormatters[key];
  return (f && f.format) ? f.format(val) : val;
};


export { view };
