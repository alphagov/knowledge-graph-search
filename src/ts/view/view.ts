import { id, splitKeywords } from '../utils';
import { state, searchState } from '../state';
import { handleEvent } from '../events';
import { languageName } from '../lang';
import { viewMetaResults } from './view-metabox';
import { viewSearchPanel } from './view-search-panel';
import { EventType } from '../event-types';


declare const window: any;

const view = () => {
  console.log('view')
  document.title = 'GovGraph search';
  const pageContent: (HTMLElement | null) = id('page-content');
  if (pageContent) {
    pageContent.innerHTML = `
      <main class="govuk-main-wrapper" id="main-content" role="main">
        ${viewErrorBanner()}
        ${viewSearchTypeSelector()}
        ${viewMainLayout()}
        <p class="govuk-body-s">
          Runs only between 9am and 7pm.
          Searches do not include history mode content, Publisher GitHub smart answers or service domains.
          Popularity scores depend on cookie consent.
        </p>
      </main>
    `;
  }

  // Add event handlers
  document.querySelectorAll('button, input[type=checkbox][data-interactive=true]')
    .forEach(input => input.addEventListener(
      'click',
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

  // focus on the results heading if present
  id('results-heading')?.focus();

};


const viewSearchTypeSelector = () => `
    <p class="govuk-body search-selector">
      Search for:
      <button class="${state.searchParams.searchType === 'keyword' ? 'active' : ''}" id="search-keyword">Keywords</button>
      <button class="${state.searchParams.searchType === 'link' ? 'active' : ''}" id="search-link">Links</button>
      <button class="${state.searchParams.searchType === 'taxon' ? 'active' : ''}" id="search-taxon">Taxons</button>
      <button class="${state.searchParams.searchType === 'language' ? 'active' : ''}" id="search-language">Languages</button>
      <button class="${state.searchParams.searchType === 'mixed' ? 'active' : ''}" id="search-mixed">Mixed</button>
    </p>
  `;


const viewMainLayout = () => {
  const result = [];
  if (state.searchParams.searchType === 'mixed') {
    if (!state.searchResults) {
      result.push(`
        <div class="govuk-grid-row mixed-layout--no-results">
          <div class="govuk-grid-column-two-thirds">
            ${viewSearchPanel()}
          </div>
        </div>
      `);
    } else {
      result.push(`
        <div class="govuk-grid-row mixed-layout">
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


const makeBold = (text: string, includeMarkup: boolean) =>
  includeMarkup ?
    `<span class="govuk-!-font-weight-bold">${text}</span>` :
    `"${text}"`;


const viewContainDescription = (includeMarkup: boolean) => {
  let where: string;
  if (state.searchParams.whereToSearch.title && state.searchParams.whereToSearch.text) {
    where = '';
  } else if (state.searchParams.whereToSearch.title) {
    where = 'in their title';
  } else {
    where = 'in their body content';
  }
  let combineOp = state.searchParams.combinator === 'all' ? 'and' : 'or';
  let combinedWords = splitKeywords(state.searchParams.selectedWords)
    .filter(w => w.length > 2)
    .map(w => makeBold(w, includeMarkup))
    .join(` ${combineOp} `);
  return state.searchParams.selectedWords !== '' ? `${combinedWords} ${where}` : '';
};


const viewQueryDescription = (includeMarkup = true) => {
  const clauses = [];
  if (state.searchParams.selectedWords !== '') {
    let keywords = `contain ${viewContainDescription(includeMarkup)}`;
    if (state.searchParams.excludedWords !== '') {
      keywords = `${keywords} (but don't contain ${makeBold(state.searchParams.excludedWords, includeMarkup)})`;
    }
    clauses.push(keywords);
  }
  if (state.searchParams.selectedTaxon !== '')
    clauses.push(`belong to the ${makeBold(state.searchParams.selectedTaxon, includeMarkup)} taxon (or its sub-taxons)`);
  if (state.searchParams.selectedLocale !== '')
    clauses.push(`are in ${makeBold(languageName(state.searchParams.selectedLocale), includeMarkup)}`);
  if (state.searchParams.linkSearchUrl !== '')
    clauses.push(`link to ${makeBold(state.searchParams.linkSearchUrl, includeMarkup)}`);
  if (state.searchParams.areaToSearch === 'whitehall' || state.searchParams.areaToSearch === 'publisher')
    clauses.push(`are published using ${makeBold(state.searchParams.areaToSearch, includeMarkup)}`);

  const joinedClauses = (clauses.length === 1) ?
    clauses[0] :
    `${clauses.slice(0, clauses.length - 1).join(', ')} and ${clauses[clauses.length - 1]}`;

  return `pages that ${joinedClauses}`;
};


const viewErrorBanner = () => {
  const html = [];
  if (state.systemErrorText || state.userErrors.length > 0) {
    html.push(`
        <div class="govuk-error-summary" aria-labelledby="error-summary-title" role="alert" tabindex="-1" data-module="govuk-error-summary">`);

    if (state.systemErrorText) {
      html.push(`
          <h1 class="govuk-error-summary__title" id="error-summary-title">There is a problem</h1>
          <p class="govuk-body">Please try again later or <a class="govuk-link" href="mailto:data-products-research@digital.cabinet-office.gov.uk">contact the Data Products team</a> if the problem persists.</p>
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
    const recordsToShow = state.searchResults?.slice(state.skip, state.skip + state.resultsPerPage);
    html.push(`
      <div class="govuk-body">
        <fieldset class="govuk-fieldset" ${state.waiting && 'disabled="disabled"'}>
          <legend class="govuk-fieldset__legend">For each result, display:</legend>
          <ul class="kg-checkboxes" id="show-fields">`);
    html.push(Object.keys(state.searchResults[0]).map(key => `
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
    return html.join('');
  } else {
    return '';
  }
};


const csvFromResults = function(searchResults: any) {
  const csv = [];
  if (searchResults && searchResults.length > 0) {
    // column headings: take them from the first record
    csv.push(Object.keys(searchResults[0]).map(fieldName).join())
    // rows:
    searchResults.forEach((record: Record<any, any>) => {
      const line: string[] = [];
      Object.values(record).forEach((field: any) => {
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
  <p class="govuk-body-s">Some queries may take up to a minute</p>
`;


const viewResults = function() {
  if (state.searchResults) {
    const html = [];
    const nbRecords = state.searchResults.length;

    if (nbRecords < 50000) {
      html.push(`
        <h1 tabindex="0" id="results-heading" class="govuk-heading-l">${nbRecords} result${nbRecords !== 0 ? 's' : ''}</h1>`);
    } else {
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

    html.push(`<div class="govuk-body">for ${viewQueryDescription()}</div>`);

    if (nbRecords >= state.resultsPerPage) {
      html.push(`
        <p class="govuk-body">Showing results ${state.skip + 1} to ${Math.min(nbRecords, state.skip + state.resultsPerPage)}, in descending popularity</p>
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
  } else {
    return '';
  }
};


const viewNoResults = () => {
  return `
    <h1 tabindex="0" id="results-heading" class="govuk-heading-l">No results</h1>
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
const formatNames = (array: []) => [...new Set(array)].map(x => `"${x}"`).join(', ');


const formatDateTime = (date: string) => `${date.slice(0, 10)} at ${date.slice(12, 16)}`;


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
    name: 'Primary publishing organisations',
    format: formatNames
  },
  'all_organisations': {
    name: 'All publishing organisations',
    format: formatNames
  },
  'pagerank': {
    name: 'Popularity',
    format: (val: number) => val ? val.toFixed(2) : 'n/a'
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


const fieldFormat = function(key: string, val: string | number) {
  const f = fieldFormatters[key];
  return (f && f.format) ? f.format(val) : val;
};


export { view };
