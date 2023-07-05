import { id, queryDescription, highlight, highlightLinks, getAnyKeywordSearchUrl, splitKeywords } from '../utils';
import { state, searchState } from '../state';
import { handleEvent, handleSorting } from '../events';
import { languageName } from '../lang';
import { viewMetaResults } from './view-metabox';
import { viewSearchPanel } from './view-search-panel';
import { viewSearchBox, viewSearchFilters } from './view-search-box';
import { EventType } from '../event-types';
import { SearchType } from '../search-api-types';

declare const window: any;

const view = () => {
  console.log('state', state)
  document.title = `Gov Search`;
  const pageContent: (HTMLElement | null) = id('page-content');
  const initialSearch = state.searchResults === null && state.userErrors.length === 0 && !state.waiting;

  var pathArray = window.location.pathname.split('/');
  var version = pathArray[1];
  document.getElementById('version').innerHTML = `v${version}`;

  if (pageContent) {
    pageContent.innerHTML = `
      <main class="govuk-main-wrapper" id="main-content" role="main">
        <div class="govuk-grid-row">
          <div class="govuk-grid-column-two-thirds">
            ${viewErrorBanner()}
            ${viewSearchBox()}
          </div>
        </div>
        <div class="govuk-grid-row">
          <div class="${ initialSearch ? `govuk-grid-column-two-thirds` : `govuk-grid-column-one-third`}">

          ${ initialSearch ?
              `<details class="govuk-details" data-module="govuk-details">
                <summary class="govuk-details__summary">
                  <span class="govuk-details__summary-text">
                    Advanced search
                  </span>
                </summary>
                <div class="govuk-details__text">
                <div id="initialSearchFilters">
                  ${viewSearchFilters()}
                  <button
                    type="submit"
                    class="govuk-button ${state.waiting ? 'govuk-button--disabled' : ''}"
                    ${state.waiting ? 'disabled="disabled"' : ''}
                    id="search">
                    Search
                  </button>
                </div>
                </div>
              </details>
              `
            :
            `<div id="filters">
              ${viewSearchFilters()}
            </div>`
          }

          </div>
          ${ initialSearch ? '' :
            `<div class="govuk-grid-column-two-thirds">
              ${viewSearchResults()}
            </div>`


          }
        </div>
      </main>`;
  }

  // Add event handlers
  document.querySelectorAll('button, input[type=checkbox][data-interactive=true], .pagination-link')
    .forEach(input => input.addEventListener(
      'click',
      event => handleEvent({ type: EventType.Dom, id: (event.target as HTMLElement).getAttribute('id') || undefined })));

  document.querySelectorAll('select#sorting')
    .forEach(input => input.addEventListener(
      'change',
      event => handleEvent({ type: EventType.Dom, id: (event.target as HTMLElement).getAttribute('id') || undefined })));

  //submit when filters change
  var elements = document.querySelectorAll('#filters input');
  elements.forEach(el => el.addEventListener('change', () => document.getElementById("search").click()));

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


  id('meta-results-expand')?.addEventListener(
    'click',
    () => handleEvent({ type: EventType.Dom, id: 'toggleDisamBox' })
  );

  // focus on the results heading if present
  id('results-heading')?.focus();

  //init GOVUKFrontend scripts
  eval('window.GOVUKFrontend.initAll()');

  //init autocomplete inputs
  eval(`
  var autocomplete = document.querySelectorAll('select.autocomplete__input');
  autocomplete.forEach(el => {
    var id = el.getAttribute('id')
      if(document.querySelector('#'+id)){
        accessibleAutocomplete.enhanceSelectElement({
          selectElement: document.querySelector('#'+id),
          //showAllValues: true,
          placeholder: 'Search for a '+ (id === 'locale' ? 'language' : id),
          onConfirm: (val) => {
            if(val && document.getElementById("filters")){
              document.getElementById(id).value = (val == 'undefined' ? '' : val);
              document.getElementById("search").click()
            }
          }
        })
      }
  });
  `)

  //set autocomplete inputs disabled
  eval(`
    const autocompleteDisabled = document.querySelectorAll('[data-state="disabled"] input');
    autocompleteDisabled.forEach(el => {
      if(el){
        el.setAttribute('disabled', 'disabled');
      }
    });
    `);

};

const viewSearchTypeSelector = () => `
    <p class="govuk-body search-selector">
      Search for:
      <button class="${state.searchParams.searchType === 'keyword' ? 'active' : ''}" id="search-keyword">Keywords</button>
      <button class="${state.searchParams.searchType === 'link' ? 'active' : ''}" id="search-link">Links</button>
      <!-- Org search is disabled until we have tested a new design with users
        <button class="${state.searchParams.searchType === 'organisation' ? 'active' : ''}" id="search-organisation">Organisations</button>
      -->
      <button class="${state.searchParams.searchType === 'taxon' ? 'active' : ''}" id="search-taxon">Taxons</button>
      <button class="${state.searchParams.searchType === 'language' ? 'active' : ''}" id="search-language">Languages</button>
      <button class="${state.searchParams.searchType === 'advanced' ? 'active' : ''}" id="search-advanced">Advanced</button>
    </p>
  `;


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
      </div>
      ${viewSearchResults()}
    `);
  }
  return result.join('');
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

const viewSearchResultsData = () => {
  const html = [];

  if (state.searchResults && state.searchResults?.length > 0) {

    const results =  state.searchResults.sort((a: any, b: any) => handleSorting(a, b, state.searchParams.sorting));

    const recordsToShow = results?.slice(state.skip, state.skip + state.resultsPerPage);

    html.push(`<div class="govuk-accordion" data-module="govuk-accordion" id="accordion-default">`);

    recordsToShow.forEach((record, recordIndex) => {
      html.push(`
        <div class="govuk-accordion__section">
            <div class="govuk-accordion__section-header">
              <h2 class="govuk-accordion__section-heading">
                <span class="govuk-accordion__section-button" id="accordion-default-heading-${recordIndex}">
                  ${record.title}
                </span>
              </h2>
              <div class="govuk-accordion__section-summary govuk-body" id="accordion-with-summary-sections-summary-${recordIndex}">
              ${ record.text && state.searchParams.selectedWords && state.searchParams.whereToSearch !== 'title' ? highlight(state.searchParams.selectedWords, record.text) : ''}
              ${ record.text && record.description && state.searchParams.selectedWords && state.searchParams.whereToSearch !== 'title' ? highlight(state.searchParams.selectedWords, record.description) : ''}
              ${ !record.text && record.description && state.searchParams.selectedWords && state.searchParams.whereToSearch !== 'title' ? highlight(state.searchParams.selectedWords, record.description) : ''}
              ${ state.searchParams.searchType === SearchType.Link && record.hyperlinks && state.searchParams.linkSearchUrl ? highlightLinks(state.searchParams.linkSearchUrl, record.hyperlinks) : ''}
            </div>
            <div
              id="accordion-default-content-${recordIndex}"
              class="govuk-accordion__section-content"
              aria-labelledby="accordion-default-heading-${recordIndex}">
              <dl class="govuk-summary-list govuk-!-font-size-16">
                ${
                  Object.keys(record).map(key => record[key] && fieldFormat(key, record[key]).length > 0 && !['contentId', 'title', 'text', 'description', 'hyperlinks'].includes(key) ? `
                  <div class="govuk-summary-list__row">
                    <dt class="govuk-summary-list__key">
                      ${fieldName(key)}
                    </dt>
                    <dd class="govuk-summary-list__value">
                      ${fieldFormat(key, record[key])}
                    </dd>
                  </div>`: '').join('')}
              </dl>
            </div>
          </div>`);
    });
    html.push(`</div>`);
    return html.join('');
  } else {
    return '';
  }
};


const viewWaiting = () => `
  <div aria-live="polite" role="region">
    <div class="govuk-body">
    ${state.waiting ? '<img src="../assets/images/loader.gif" height="20px" alt="loader" class="loader-gif"/>' : ''}
    Searching for ${queryDescription(state.searchParams)}</div>
    <p class="govuk-body-s">Some queries may take up to a minute</p>
  </div>
`;


const viewResults = function() {
  if (state.searchResults) {
    const html = [];
    const nbRecords = state.searchResults.length;

      html.push(`<div class="govuk-grid-row">
        <div class="govuk-grid-column-two-thirds">`)

    if (nbRecords < 10000) {
      html.push(`<h1 tabindex="0" id="results-heading" class="govuk-heading-l govuk-!-margin-bottom-2">${nbRecords} result${nbRecords > 1 ? 's' : ''}</h1>`);
    } else {
      html.push(`<div class="govuk-warning-text">
        <span class="govuk-warning-text__icon" aria-hidden="true">!</span>
        <strong class="govuk-warning-text__text">
          <span class="govuk-warning-text__assistive">Warning</span>
          There are more than 10000 results for ${queryDescription(state.searchParams)}. Try to narrow down your search.
        </strong>
      </div>`)
    }

    html.push(`</div>
    <div class="govuk-grid-column-one-third">
      <div class="download-top"><a class="govuk-link" href="/csv${window.location.search}" download="export.csv">Download all in CSV</a></div>
    </div>
  </div>`)


if (nbRecords < 10000) {
    html.push(`<div class="govuk-body">for ${queryDescription(state.searchParams)}</div>`);
}
    if (nbRecords > state.resultsPerPage) {

      html.push(`
        <!-- <p class="govuk-body">Showing results ${state.skip + 1} to ${Math.min(nbRecords, state.skip + state.resultsPerPage)}, in descending popularity</p> -->
        <a class="govuk-skip-link" href="#results-table">Skip to results</a>
        <a class="govuk-skip-link" href="#search-form">Back to search filters</a>
     `);
    }

    html.push(`<div class="govuk-form-group sort-options">
      <label class="govuk-label sort-options__label" for="sort">
        Sort by
      </label>
      <select class="govuk-select" id="sorting" name="sort">
        <option value="pageViewsDesc" ${state.searchParams.sorting === "pageViewsDesc" ? "selected" : ''}>Page views (highest)</option>
        <option value="pageViewsAsc" ${state.searchParams.sorting === "pageViewsAsc" ? "selected" : ''}>Page views (lowest)</option>
        <option value="recentlyUpdated" ${state.searchParams.sorting === "recentlyUpdated" ? "selected" : ''}>Recently updated</option>
        <option value="recentlyPublished" ${state.searchParams.sorting === "recentlyPublished" ? "selected" : ''}>Recently published</option>
      </select>
    </div>`);

    html.push(viewSearchResultsData());

    html.push(`<nav class="govuk-pagination govuk-pagination--block" role="navigation" aria-label="results"><div class="govuk-pagination__prev">

    ${ state.skip < state.resultsPerPage ? '' : `
    <div class="govuk-pagination__prev">
      <a class="govuk-link govuk-pagination__link pagination-link" href="javascript:void(0)" rel="prev" id="button-prev-page">
        <svg class="govuk-pagination__icon govuk-pagination__icon--prev" xmlns="http://www.w3.org/2000/svg" height="13" width="15" aria-hidden="true" focusable="false" viewBox="0 0 15 13">
          <path d="m6.5938-0.0078125-6.7266 6.7266 6.7441 6.4062 1.377-1.449-4.1856-3.9768h12.896v-2h-12.984l4.2931-4.293-1.414-1.414z"></path>
        </svg>
        <span class="govuk-pagination__link-title">Previous</span><span class="govuk-visually-hidden">:</span>
          <span class="govuk-pagination__link-label">${state.skip/state.resultsPerPage} of ${Math.round(state.searchResults.length/Number(state.resultsPerPage))}</span></a>
    </div>
    ` }

    ${ (state.skip + state.resultsPerPage >= nbRecords) ? '' : `
    <div class="govuk-pagination__next">
          <a class="govuk-link govuk-pagination__link pagination-link" href="javascript:void(0)" rel="next" id="button-next-page">
          <svg class="govuk-pagination__icon govuk-pagination__icon--next" xmlns="http://www.w3.org/2000/svg" height="13" width="15" aria-hidden="true" focusable="false" viewBox="0 0 15 13">
            <path d="m8.107-0.0078125-1.4136 1.414 4.2926 4.293h-12.986v2h12.896l-4.1855 3.9766 1.377 1.4492 6.7441-6.4062-6.7246-6.7266z"></path>
          </svg>        <span class="govuk-pagination__link-title">Next</span><span class="govuk-visually-hidden">:</span>
              <span class="govuk-pagination__link-label">${(state.skip/state.resultsPerPage) + 2 } of ${Math.round(state.searchResults.length/Number(state.resultsPerPage))}</span></a>
        </div>
        ` }
    </nav>`);


    html.push(`
      <p class="govuk-body-s"><a class="govuk-link" href="/csv${window.location.search}" download="export.csv">Download all in CSV</a></p>`);
    return html.join('');
  } else {
    return '';
  }
};

const viewNoResults = () => {
  return `
    <h1 tabindex="0" id="results-heading" class="govuk-heading-l">No results</h1>
    <p class="govuk-body">for ${queryDescription(state.searchParams)}</p>
    ${state.searchParams.combinator === 'all' && splitKeywords(state.searchParams.selectedWords).length > 1 ? `<p class="govuk-body">Try searching for <a class="govuk-link" href="?${getAnyKeywordSearchUrl(state.searchParams)}">any of your keywords</a></p>` : ''}
  `;
};

const viewSearchResults = () => {
  switch (searchState().code) {
    case 'waiting':
      document.title = `GOV.UK ${queryDescription(state.searchParams, false)} - Gov Search`;
      return viewWaiting();
    case 'results':
    case 'specialist-publisher-search':
      document.title = `GOV.UK ${queryDescription(state.searchParams, false)} - Gov Search`;
      if (window.ga) window.ga('send', 'search', { search: document.title, resultsFound: true });
      return viewResults();
    case 'no-results':
      document.title = `GOV.UK ${queryDescription(state.searchParams, false)} - Gov Search`;
      if (window.ga) window.ga('send', 'search', { search: document.title, resultsFound: false });
      return viewNoResults();
    default:
      document.title = 'Gov Search';
      return '';
  }
};


const formatNames = (array: []) => [...new Set(array)].map(x => `${x}`).join(', ');


const formatDateTime = (date: any) =>
  `${date.value.slice(0,10).split('-').reverse().join('/') }`;

const formatTitleCase = (word: string) => word[0].toUpperCase() + word.slice(1).toLowerCase().replace('_', ' ');


const fieldFormatters: Record<string, any> = {
  'url': {
    name: 'URL',
    format: (url: string) => `<a class="govuk-link" target="_blank" href="${url}">${url}</a>`
  },
  'contentId': {name: 'Content ID' },
  'title': { name: 'Title' },
  'locale': { name: 'Language', format: languageName },
  'documentType': { name: 'Document type', format: formatTitleCase },
  'publishing_app': { name: 'Publishing app', format: formatTitleCase },
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
