import { id, queryDescription, highlight, highlightLinks, getAnyKeywordSearchUrl, splitKeywords, formatSorting, paginate } from '../utils';
import { state, searchState } from '../state';
import { handleEvent, handleSorting, getSortEventAction } from '../events';
import { languageName } from '../lang';
import { viewMetaResults } from './view-metabox';
import { viewSearchPanel } from './view-search-panel';
import { viewSearchBox, viewSearchFilters } from './view-search-box';
import { EventType } from '../event-types';
import { Sorting, Pages, SearchType } from '../search-api-types';
//const tableDragger = require('table-dragger');

declare const window: any;

var pathArray = window.location.pathname.split('/');
var version = pathArray[1];
document.getElementById('version').innerHTML = `v${version}`;

const getHeight = (el: any) => {
  el = (typeof el === 'string') ? document.querySelector(el) : el;

  var styles = window.getComputedStyle(el);
  var margin = parseFloat(styles['marginTop']) +
               parseFloat(styles['marginBottom']);

  return Math.ceil(el.offsetHeight + margin);
}

const arrayMove = <T>(arr: T[], fromIndex: number, toIndex: number) => {
  const newArr = [...arr];
  newArr.splice(toIndex, 0, newArr.splice(fromIndex, 1)[0]);
  return newArr;
};


const view = () => {
  console.log('state', state)
  document.title = 'Gov Search';
  const pageContent: (HTMLElement | null) = id('page-content');
  const initialSearch = state.searchResults === null && state.userErrors.length === 0 && !state.waiting;


  const viewSearchButton = () => `
    <p class="govuk-body">
      <button
        type="submit"
        class="govuk-button ${state.waiting ? 'govuk-button--disabled' : ''}"
        ${state.waiting ? 'disabled="disabled"' : ''}
        id="search">
        ${state.waiting ? 'Applying filters <img src="assets/images/loader.gif" height="20px" alt="loader"/>' : 'Apply filters'}
      </button>
    </p>
    <p class="govuk-body" style="margin-top: 40px;">
      <a href="javascript:void(0)" id="clear-filters" class="govuk-link">Clear filters</a>
    </p>
  `;

  if (pageContent) {
    pageContent.innerHTML = `
      <main class="govuk-main-wrapper" id="main-content" role="main">
        <div class="govuk-grid-row">
          <div class="govuk-grid-column-two-thirds">
            <div id="event-name-hint" class="govuk-hint">
              ${state.searchParams.searchType === 'keyword' ? 'Use quotes for phrases eg, "UK driving licence" and spaces or commas for multiple keywords or phrases' : 'Use full or partial URLs eg, https://www.gov.uk/tax-codes or tax-codes'}
            </div>
            ${viewErrorBanner()}
            ${viewSearchBox(initialSearch)}
          </div>
        </div>
        ${ initialSearch ? '' : `<div class="govuk-grid-row">


        </div>`}

        <div class="govuk-grid-row">
          <div id="sideBar" class="${ initialSearch ? `govuk-grid-column-two-thirds margin-top-minus-30` : `govuk-grid-column-one-quarter`}">

          ${ initialSearch ?
              `<details class="govuk-details" data-module="govuk-details" style="margin-top: 20px; margin-bottom: 10px;">
                <summary class="govuk-details__summary">
                  <span class="govuk-details__summary-text">
                    Search filters
                  </span>
                </summary>
                <div class="govuk-details__text" style="padding-bottom: 0;">
                <div id="initialSearchFilters" class="column-flex">
                  ${viewSearchFilters()}
                </div>
                </div>
              </details>
              <button
                type="submit"
                class="govuk-button ${state.waiting ? 'govuk-button--disabled' : ''}"
                ${state.waiting ? 'disabled="disabled"' : ''}
                id="search">
                Search
              </button>
              `
            :
            `<div id="filters" class="box-border ${state.showFilters ? '' : 'hidden'}">
              <h2 class="govuk-heading-m">Filters</h2>
              ${viewSearchFilters()}
              ${viewSearchButton()}
            </div>`
          }

          </div>
          ${ initialSearch ? '' :
            `<div class="govuk-grid-column-${state.showFilters ? 'three-quarters' : 'full'}">
              ${viewSearchResults()}
            </div>`
          }
        </div>
        ${ initialSearch ?
        `<div class="govuk-grid-row">
          <div class="govuk-grid-column-two-thirds">
            <div class="govuk-inset-text">
              Searches do not include history mode content, Publisher GitHub smart answers or service domains. Page views depend on cookie consent. Data can be up to 24 hours delayed.
            </div>
          </div>
        </div>`: ''}
      </main>`;
  }

  // Add event handlers
  document.querySelectorAll('button, input[type=checkbox][data-interactive=true], .pagination-link, #sort button, #clear-filters, #button-prev-page, #uncheck-all, #check-all')
    .forEach(input => input.addEventListener(
      'click',
      event => handleEvent({ type: EventType.Dom, id: (event.target as HTMLElement).getAttribute('id') || undefined })));

  document.querySelectorAll('select#sorting, #searchType, #download, #resultsPerPage')
    .forEach(input => input.addEventListener(
      'change',
      event => handleEvent({ type: EventType.Dom, id: (event.target as HTMLElement).getAttribute('id') || undefined })));

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


  document.querySelectorAll('.pagination-link-item')
    .forEach(input => input.addEventListener(
      'click',
      event => handleEvent({ type: EventType.Dom, id: 'paginationLink', element: event })));


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
          //dropdownArrow: () => '<svg class="autocomplete__dropdown-arrow-down" style="top: 8px;" viewBox="0 0 512 512"><path d="M256,298.3L256,298.3L256,298.3l174.2-167.2c4.3-4.2,11.4-4.1,15.8,0.2l30.6,29.9c4.4,4.3,4.5,11.3,0.2,15.5L264.1,380.9  c-2.2,2.2-5.2,3.2-8.1,3c-3,0.1-5.9-0.9-8.1-3L35.2,176.7c-4.3-4.2-4.2-11.2,0.2-15.5L66,131.3c4.4-4.3,11.5-4.4,15.8-0.2L256,298.3  z"></path></svg>',
          //confirmOnBlur: false,
          placeholder: 'Start typing '+ ( id === 'searchArea' ? 'a publishing application' : id === 'documentType' ? 'a document type' : id === 'locale' ? 'a language' : id === 'organisation' ? 'an organisation' : 'a ' + id),
          onConfirm: (val) => {
            if(val && document.getElementById("filters")){
              document.getElementById(id).value = (val == 'undefined' ? '' : val);
              //document.getElementById("search").click()
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

  eval(`
    if (document.getElementById('wrapper')) {
      document.getElementById('wrapper').style.height = getHeight('#sideBar') - (getHeight('#actionsBar') + getHeight('#queryDescription') + getHeight('#resultsPerPagePanel') + getHeight('#pagination')) + 'px'

      if(Number(document.getElementById('resultsPerPage').selectedOptions[0].value) <= 20){
        document.getElementById('wrapper').style.height = 'auto'
      }
    }
  `);

  var el = document.getElementById('results-table');
  if(el && Object.keys(state.showFields).length){
    var dragger = window.tableDragger.default(el, {
       dragHandler: '.handle'
    })
    dragger.on('drop',function(from, to){

      let tempObj = Object.keys(state.showFields)
      const newArray = {}

      tempObj = arrayMove(tempObj, (from-1), (to-1))

      tempObj.forEach((a: any) => {
        newArray[a] = true;
      })
      state.showFields = newArray

    })
    .on('drag', () => {
      const removeElement = () => {
        const el = document.querySelector('li.gu-mirror table tbody')
        if(el) el.remove()
      }
      setTimeout(removeElement, 0);

      });
  }
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

const viewSearchResultsTable = () => {
  const html = [];
 if (state.searchResults && state.searchResults?.length > 0) {

   const results =  state.searchResults.sort((a: any, b: any) => handleSorting(a, b, state.searchParams.sorting));

   const recordsToShow = results?.slice(state.skip, state.skip + state.resultsPerPage);

html.push(`
  <div class="actions-bar" id="actionsBar">
    <button class="govuk-button govuk-button--secondary" id="toggle-filters" style="margin-right: 8px">${state.showFilters ? 'Hide' : 'Show'} filters</button>
    <button class="govuk-button govuk-button--secondary" id="showHeaders">${state.showHeaders ? 'Hide' : 'Show'} header options</button>
    <div style="float:right;">
    <button class="govuk-button govuk-button--secondary" id="newSearch" style="margin-right: 8px">New search</button>
     <label class="govuk-label govuk-visually-hidden" for="download">
       Export data (csv)
     </label>
     <select class="govuk-select" id="download" name="download">
       <option value="" disabled selected>Export data (csv)</option>
       <option value="export.csv">Current results (${state.resultsPerPage})</option>
       <option value="export.csv">All results (${state.searchResults?.length})</option>
     </select>
   </div>
  </div>

    <div id="show-fields" class="govuk-form-group header-options ${state.showHeaders ? '' : 'checkbox-list-hidden'}">
      <fieldset class="govuk-fieldset" style="display: contents" >
      <legend class="govuk-fieldset__legend govuk-fieldset__legend--m">
         Customise table headers
       </legend>
       <p class="govuk-body">
        <a class="govuk-link" id="uncheck-all" href="javascript:void(0)" style="border-right: 1px solid grey;padding-right: 14px;">Clear all headers</a>
        <a class="govuk-link" id="check-all" href="javascript:void(0)" style="margin-left: 10px;">Select all headers</a>
       </p>
       <div class="govuk-checkboxes govuk-checkboxes--small checkbox-list" data-module="govuk-checkboxes" >`);

    let excludeList = ['hyperlinks'];

   if(state.searchParams.pages === Pages.NotWithdrawn) {
     excludeList = ['hyperlinks', 'withdrawn_at', 'withdrawn_explanation'];
   }



html.push(Object.keys(state.searchResults[0]).map(key =>
!excludeList.includes(key)  ? `
        <div class="govuk-checkboxes__item">

          <input
                class="govuk-checkboxes__input"
                 data-interactive="true"
                 type="checkbox"
                 id="show-field-${key}"
                 name="show-field-${key}"
            ${state.showFields[key] ? 'checked' : ''}/>
          <label
          class="govuk-label govuk-checkboxes__label"
          for="show-field-${key}" >${fieldName(key)}</label>
        </div>

`: '').join(''));

html.push(`

    </div>
        </fieldset>
    </div>


  `)


  if (!Object.keys(state.showFields).length) html.push('<div class="govuk-inset-text">You have cleared all headers</div>')

   html.push(`
     <div id="wrapper" style="height: 100vh">
       <table id="results-table" class="govuk-table sticky-header">
         <thead class="govuk-table__body">
         <tr class="govuk-table__row" id="sort">
           <th scope="col" class="a11y-hidden">Page</th>`);


   Object.keys(state.showFields).forEach(key => {
   if (state.showFields[key] && !['hyperlinks'].includes(key)){
       html.push(`<th scope="col" class="govuk-table__header handle" data-header="${key}">
       <button
        id="sort-${key}"
        data-event-action="${getSortEventAction(state.searchParams.sorting, key)}"
        class="sort-header">${fieldName(key)}</button></td>`);
     }
   });
 html.push(`</th></thead><tbody class="govuk-table__body">`)
   recordsToShow.forEach((record, recordIndex) => {
     html.push(`
       <tr class="govuk-table__row">
         <td class="a11y-hidden">${recordIndex}</td>`);
     Object.keys(state.showFields).forEach(key => {
       if (state.showFields[key]  ) {
         html.push(`<td class="govuk-table__cell">${fieldFormat(key, record[key])}</td>`);
       }
     });
     html.push(`</tr>`);
   });
   html.push(`
         </tbody>
       </table></div>
`);
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



    if (nbRecords >= 10000) {
      html.push(`<div class="govuk-grid-row">
        <div class="govuk-grid-column-two-thirds"><div class="govuk-warning-text">
        <span class="govuk-warning-text__icon" aria-hidden="true">!</span>
        <strong class="govuk-warning-text__text">
          <span class="govuk-warning-text__assistive">Warning</span>
          There are more than 10000 results for ${queryDescription(state.searchParams)}. Try to narrow down your search.
        </strong>
      </div></div>
    </div>`)
    }


if (nbRecords < 10000) {
    html.push(`<div class="govuk-body" id="queryDescription"><strong>${nbRecords === 0 ? 'No' : nbRecords} result${nbRecords > 1 ? 's' : ''}</strong> for ${queryDescription(state.searchParams)} and ordered by ${formatSorting[state.searchParams.sorting]}</div>`);
}

    html.push(viewSearchResultsTable());

      html.push(`
        <div class="govuk-form-group" id="resultsPerPagePanel">
        <label class="govuk-body" for="resultsPerPage" style="display: inline-block;">
          Results per page
        </label>
        <select class="govuk-select" id="resultsPerPage" name="resultsPerPage" style="min-width: auto; margin-right: 20px">
          <option value="10" ${state.resultsPerPage === 10 ? 'selected' : ''}>10</option>
          <option value="20" ${state.resultsPerPage === 20 ? 'selected' : ''}>20</option>
          <option value="50" ${state.resultsPerPage === 50 ? 'selected' : ''}>50</option>
          <option value="100" ${state.resultsPerPage === 100 ? 'selected' : ''}>100</option>
          <option value="200" ${state.resultsPerPage === 200 ? 'selected' : ''}>200</option>
        </select>
        <span class="govuk-body">${state.skip + 1} to ${Math.min(nbRecords, state.skip + state.resultsPerPage)} of ${nbRecords}</span>
      </div>`);

    const currentPage = Math.round((state.skip/state.resultsPerPage) + 1)
    const totalPages = Math.round(state.searchResults.length/Number(state.resultsPerPage));
    const pagination = paginate(currentPage, totalPages)

    html.push(`<nav id="pagination" class="govuk-pagination" role="navigation" aria-label="results"><ul class="govuk-pagination__list">
    ${state.skip < state.resultsPerPage ? '' : `<div class="govuk-pagination__prev">
    <a class="govuk-link govuk-pagination__link pagination-link" href="javascript:void(0)" rel="prev" id="button-prev-page">
      <svg class="govuk-pagination__icon govuk-pagination__icon--prev" xmlns="http://www.w3.org/2000/svg" height="13" width="15" aria-hidden="true" focusable="false" viewBox="0 0 15 13">
        <path d="m6.5938-0.0078125-6.7266 6.7266 6.7441 6.4062 1.377-1.449-4.1856-3.9768h12.896v-2h-12.984l4.2931-4.293-1.414-1.414z"></path>
      </svg>
      <span class="govuk-pagination__link-title">Previous</span></a>
  </div>`}`)

    totalPages > 1 && html.push(pagination?.items?.map(x => x === '…' ? '<li class="govuk-pagination__item govuk-pagination__item--ellipses">&ctdot;</li>' : `<li class="govuk-pagination__item ${pagination.current === x ? 'govuk-pagination__item--current' : ''}">
      <a class="govuk-link govuk-pagination__link pagination-link-item" href="javascript:void(0)" aria-label="Page ${x}" ${pagination.current === x ? 'aria-current="page"' : ''}>
        ${x}
      </a>
    </li>`).join(' '))

    html.push(`${ (state.skip + state.resultsPerPage >= nbRecords) ? '' : `
    <div class="govuk-pagination__next">
    <a class="govuk-link govuk-pagination__link pagination-link" href="javascript:void(0)" rel="next" id="button-next-page">
    <span class="govuk-pagination__link-title">Next</span> <svg class="govuk-pagination__icon govuk-pagination__icon--next" xmlns="http://www.w3.org/2000/svg" height="13" width="15" aria-hidden="true" focusable="false" viewBox="0 0 15 13">
        <path d="m8.107-0.0078125-1.4136 1.414 4.2926 4.293h-12.986v2h12.896l-4.1855 3.9766 1.377 1.4492 6.7441-6.4062-6.7246-6.7266z"></path>
      </svg></a>
  </div>`}
      </ul>`)

    return html.join('');
  } else {
    return '';
  }
};


const viewNoResults = () => {
  return `<div class="govuk-inset-text">
  <p class="govuk-body" tabindex="0"><strong>No results</strong> for ${queryDescription(state.searchParams)}</p>
  ${state.searchParams.combinator === 'all' && splitKeywords(state.searchParams.selectedWords).length > 1 ? `<p class="govuk-body">Try searching for <a class="govuk-link" href="?${getAnyKeywordSearchUrl(state.searchParams)}">any of your keywords</a></p>` : '<p class="govuk-body">Try a different keyword or adjust your filters</p><p class="govuk-body"><button class="govuk-button govuk-button--secondary" id="newSearch" style="margin-right: 8px">New search</button></p>'}
</div>`;
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

const formatTags = (array: []) => array.length ? `<ul class="tags-list">${[...new Set(array)].map(x => `<li>${x}</li>`).join(' ')}</ul>` : 'n/a';
const formatNames = (array: []) => [...new Set(array)].map(x => `<span>${x}</span>`).join(', ');
const getDataByTitle = (title: string) => state.searchResults.filter(x => x.title === title)[0];
const formatDateTime = (date: any) =>
  `${date.value.slice(0,10).split('-').reverse().join('/') }`;

const formatTitleCase = (word: string) => word[0].toUpperCase() + word.slice(1).toLowerCase().replace(/_/g, ' ');

const formatPreview = (preview: string, key: any) => {
  const k = key.replace('keyword_', '').replace(/_/g, ' ')
  if(preview){
    return highlight(k, preview)
  } else {
   return '';
  }
}

const formatOccurrences = (obj: any) => obj && Object.values(obj)?.length > 1
? `Total (${Object.values(obj).reduce((partialSum: any, a: any) => partialSum + a, 0)}),
  ${Object.values(obj).map((x, i) => `${splitKeywords(state.searchParams.selectedWords)[i]} (${x})` ).join(', ')}`
: `${obj}`;

const fieldFormatters: Record<string, any> = {
  'url': {
    name: 'URL',
    format: (url: string) => `<a class="govuk-link govuk-link--no-underline" target="_blank" href="${url}">${url.replace('https://www.gov.uk', '')}</a>`
  },
  'contentId': {name: 'Content ID' },
  'title': { name: 'Page title'},
  'locale': { name: 'Language', format: languageName },
  'documentType': { name: 'Document type', format: formatTitleCase },
  'publishing_app': { name: 'Publishing app', format: formatTitleCase },
  'first_published_at': {
    name: 'Published',
    format: formatDateTime
  },
  'public_updated_at': {
    name: 'Updated',
    format: formatDateTime,
  },
  'taxons': {
    name: 'Taxons',
    format: formatNames
  },
  'primary_organisation': {
    name: 'Primary publishing organisation',
    format: (x: string) => x ? x : 'n/a'
  },
  'all_organisations': {
    name: 'All publishing organisations',
    format: formatNames
  },
  'page_views': {
    name: 'Views (7 days)',
    format: (val: string) => val ? parseInt(val).toLocaleString("en-US").toString() : 'less than 5'
  },
  'withdrawn_at': {
    name: 'Date withdrawn',
    format: (date: string) => date ? formatDateTime(date) : 'n/a'
  },
  'withdrawn_explanation': {
    name: 'Withdrawn reason',
    format: (text: string) => text || 'n/a'
  },
  'description': {
    name: 'Page description',
    format: (text: string) => text || 'n/a'
  },
  'occurrences': {
    name: 'Occurrences',
    format: formatOccurrences
  },
  'keyword': {
    format: (val: string, key: any) => formatPreview(val, key)
  }
};


const fieldName = function(key: string) {
  const f = fieldFormatters[key];
  return f ? f.name : key.includes('keyword_') ? `Preview: ${key.replace('keyword_', '').replace(/_/g, ' ')}` : key;
};


const fieldFormat = function(key: string, val: string | number):string {
  const f = fieldFormatters[key];
  return (f && f.format) ? f.format(val) :  key.includes('keyword_') ? fieldFormatters['keyword'].format(val, key) : val;
};


export { view };
