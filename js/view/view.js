/*eslint no-unused-vars: ["error", { "varsIgnorePattern": "view" }]*/

import { id, sanitise, splitKeywords } from '../utils.js';
import { state, searchState } from '../state.js';
import { handleEvent } from '../events.js';
import { languageName } from '../lang.js';
import { viewMetaResults } from './view-metabox.js';

const view = () => {
  console.log('view')
  document.title = 'GovGraph search';
  id('page-content').innerHTML = `
    <main class="govuk-main-wrapper" ${state.infoPopupHtml ? 'style="filter: blur(2px)"' : ''} id="main-content" role="main">
      ${viewBanner()}
      ${viewErrorBanner()}
      <div class="govuk-grid-row">
        <div class="govuk-grid-column-one-third">
          ${viewSearchPanel()}
        </div>
        <div class="govuk-grid-column-two-thirds">
          ${viewSearchResults(state.searchResults, state.showFields)}
        </div>
      </div>
    </main>
    ${viewInfoPopup()}
  `;


  // Add event handlers
  document.querySelectorAll('button.govuk-button, input[type=checkbox][data-interactive=true]')
    .forEach(input => input.addEventListener(
      'click',
      event => handleEvent({type: 'dom', id: event.target.getAttribute('id')})));

  document.getElementById('search-form').addEventListener(
    'submit',
    event => {
      event.preventDefault();
      handleEvent({type: 'dom', id: 'search'});
    });

  document.getElementById('info-popup-close')?.addEventListener(
    'click',
    () => {
      state.infoPopupHtml = null;
      view();
    });

  id('info-button-content').addEventListener('click', () => {
    state.infoPopupHtml = { title: 'Keyword location: body content', 'body': 'This includes Whitehall summary and Mainstream meta tag description.' };
    view();
  });

  id('info-button-link').addEventListener('click', () => {
    state.infoPopupHtml = { title: 'Link search', 'body': 'This only looks for links in the body content and not related links.' };
    view();
  });

  id('info-button-taxon').addEventListener('click', () => {
    state.infoPopupHtml = { title: 'Taxon', 'body': 'Searches include the selected topic taxon and all its child taxons.' };
    view();
  });

  id('info-button-mainstream').addEventListener('click', () => {
    state.infoPopupHtml = { title: 'Mainstream Publisher', 'body': 'Results show under the main guide URL not as individual chapters.' };
    view();
  });

  id('info-button-popularity')?.addEventListener('click', () => {
    state.infoPopupHtml = { title: 'Sorted by popularity', 'body': 'The popularity score is based on the number of onsite links to the page and 3 weeks of Google Analytics traffic. A higher score means greater popularity.' };
    view();
  });

  // focus any modal
  id('info-popup')?.focus();
};


const viewInfoPopup = () => {
  if (state.infoPopupHtml !== null) {
    return `
      <div class="info-popup">
        <div class="info-popup--backdrop"></div>
        <dialog class="info-popup--panel" id="info-popup" aria-modal="true" role="dialog" tabindex="0">
          <div class="info-popup--header">${viewCrownSymbol()}</div>
          <div class="info-popup--content">
          <h1 class="govuk-heading-m">${sanitise(state.infoPopupHtml?.title)}</h1>
            <p class="govuk-body">${sanitise(state.infoPopupHtml?.body)}</h1>
            <button type="button" class="info-popup--button" id="info-popup-close" aria-label="Close modal dialogue">×</button>
          </div>
        </dialog>
      </div>
    `
  } else return '';
};


const viewBanner = () => `
  <div class="govuk-grid-row">
    <div class="govuk-grid-column-two-thirds">
      <h1 class="govuk-heading-xl main-title">
        <strong class="govuk-tag govuk-phase-banner__content__tag">DISCOVERY</strong><br/>
        GovGraph search
      </h1>
      <p class="govuk-body-s">Search for GOV.UK content containing keywords, links or by topic taxon.<br/>Runs only between 9am and 7pm.</p>
      <p class="govuk-body">This is a discovery tool. Searches do not include history mode content, Mainstream GitHub smart answers or service domains. Popularity scores depend on cookie consent.</p>
    </div>
  </div>
`;


const makeBold = (text, includeMarkup) =>
  includeMarkup ?
    `<span class="govuk-!-font-weight-bold">${text}</span>` :
    `"${text}"`;


const viewContainDescription = (words, includeMarkup) => {
  let where;
  if (state.whereToSearch.title && state.whereToSearch.text) {
    where = '';
  } else if (state.whereToSearch.title) {
    where = 'in their title';
  } else {
    where = 'in their body content';
  }
  let combineOp = state.combinator === 'all' ? 'and' : 'or';
  let combinedWords = splitKeywords(words)
    .map(w=>makeBold(w, includeMarkup))
    .join(` ${combineOp} `);
  return words !== '' ? `${combinedWords} ${where}` : '';
};


const viewQueryDescription = (includeMarkup = true) => {
  const clauses = [];
  if (state.selectedWords !== '') {
    let keywords = `contain ${viewContainDescription(state.selectedWords, includeMarkup)}`;
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
            case 'missingCombinator':
            html.push(`
            <li><a href="#combinator-wrapper">You need to select how to search for keywords</a></li>`);
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
}


const viewSearchPanel = () => `
  <form id="search-form" class="search-panel govuk-form">
    <div class="search-mode-panel">
      ${viewKeywordsInput()}
      ${viewKeywordsCombinator()}
      ${viewExclusionsInput()}
      ${viewCaseSensitiveSelector()}
      ${viewScopeSelector()}
      ${viewLinkSearch()}
      ${viewPublishingAppSelector()}
      ${viewTaxonSelector()}
      ${viewLocaleSelector()}
      ${viewSearchButton()}
    </div>
    <div ckass="sig">
      <p class="govuk-body">Brought to you by the Data Labs</p>
      <p class="govuk-body">Help/problem/feedback: contact <a href="mailto:max.froumentin@digital.cabinet-office.gov.uk">Max Froumentin</a></p>
    </div>
  </form>
`;


const viewKeywordsInput = () => `
  <div class="govuk-body">
    <label for="keyword" class="govuk-label label--bold">Search keywords</label>
    <div class="govuk-hint">
      For example: cat, dog, &quot;health certificate&quot;
    </div>
    <input
      ${state.waiting && 'disabled="disabled"'}
      class="govuk-input"
      id="keyword"
      value='${sanitise(state.selectedWords).replace('"', '&quot;')}'
    />
  </div>
`;


const viewExclusionsInput = () => `
  <div class="govuk-body">
    <label for="excluded-keyword" class="govuk-label label--bold">
      Exclude keywords
    </label>
    <div class="govuk-hint">
      For example: passport
    </div>
    <input class="govuk-input"
        ${state.waiting && 'disabled="disabled"'}
        id="excluded-keyword"
        value='${sanitise(state.excludedWords).replace('"', '&quot;')}'/>
  </div>
`;


const viewInlineError = (id, message) => `
  <p id="${id}" class="govuk-error-message">
    <span class="govuk-visually-hidden">Error:</span> ${message}
  </p>
`;


const viewScopeSelector = () => {
  const errors = searchState()?.errors;
  const err = errors && errors.includes('missingWhereToSearch');
  return `
  <div class="govuk-form-group ${err ? 'govuk-form-group--error' : ''}">
    <fieldset
        class="govuk-fieldset"
        ${state.waiting && 'disabled="disabled"'}
        id="search-scope-wrapper"
        aria-describedby="scope-hint ${err ? 'scope-error' : ''}">
      <legend class="govuk-fieldset__legend">
        Keyword location
      </legend>
      <div id="scope-hint" class="govuk-hint">
        Select all that apply
      </div>
      ${err ? viewInlineError('scope-error', 'Please choose at least one option') : ''}
      <div class="govuk-checkboxes" id="search-locations">
        <div class="govuk-checkboxes__item">
          <input
              class="govuk-checkboxes__input"
              type="checkbox" id="search-title"
              ${state.whereToSearch.title ? 'checked' : ''}/>
          <label for="search-title" class="govuk-label govuk-checkboxes__label">title</label>
        </div>
        <div class="govuk-checkboxes__item">
          <input
              class="govuk-checkboxes__input"
              type="checkbox"
              id="search-text"
            ${state.whereToSearch.text ? 'checked' : ''}/>
          <label for="search-text" class="govuk-label govuk-checkboxes__label">
            body content&nbsp;${viewInfoButton('content')}
          </label>
        </div>
      </div>
    </fieldset>
  </div>
  `;
};

const viewCaseSensitiveSelector = () => `
  <div class="govuk-body">
    <div class="govuk-checkboxes">
      <div class="govuk-checkboxes__item">
        <input
            class="govuk-checkboxes__input"
            ${state.waiting && 'disabled="disabled"'}
            type="checkbox"
            id="case-sensitive"
            ${state.caseSensitive ? 'checked' : ''}
        />
        <label for="case-sensitive" class="govuk-label govuk-checkboxes__label">case-sensitive search</label>
      </div>
    </div>
  </div>
`;

const viewKeywordsCombinator = () => {
  const errors = searchState()?.errors;
  const err = errors && errors.includes('missingCombinator');
  return `
  <div class="govuk-form-group ${err ? 'govuk-form-group--error' : ''}">
    <fieldset
        class="govuk-fieldset"
        id="combinator-wrapper"
        ${state.waiting && 'disabled="disabled"'}
        aria-describedby="combinator-hint ${err ? 'combinator-error' : ''}">
      <legend class="govuk-fieldset__legend">
        Search for
      </legend>
      <div id="combinator-hint" class="govuk-hint">
        Choose one option
      </div>
      ${err ? viewInlineError('combinator-error', 'Please choose one option') : ''}
      <div class="govuk-radios" id="combinators">
        <div class="govuk-radios__item">
          <input class="govuk-radios__input"
                 type="radio" id="combinator-any"
                 name="combinator"
            ${state.combinator === 'any' ? 'checked' : ''}/>
          <label for="combinator-any" class="govuk-label govuk-radios__label">
            any keyword
          </label>
        </div>
        <div class="govuk-radios__item">
          <input class="govuk-radios__input"
                 type="radio" id="combinator-all"
                 name="combinator"
            ${state.combinator === 'all' ? 'checked' : ''}/>
          <label for="combinator-all" class="govuk-label govuk-radios__label">
            all keywords
          </label>
        </div>
      </div>
    </fieldset>
  </div>
  `;
};

const viewPublishingAppSelector = () => {
  const errors = searchState()?.errors;
  const err = errors && errors.includes('missingArea');
  return `
  <div class="govuk-form-group ${err ? 'govuk-form-group--error' : ''}">
    <fieldset
        class="govuk-fieldset"
        id="search-areas-wrapper"
        ${state.waiting && 'disabled="disabled"'}
        aria-describedby="area-hint ${err ? 'area-error' : ''}">
      <legend class="govuk-fieldset__legend">
        Limit search
      </legend>
      <div id="area-hint" class="govuk-hint">
        Choose one option
      </div>
      ${err ? viewInlineError('area-error', 'Please choose one option') : ''}
      <div class="govuk-radios" id="site-areas">
        <div class="govuk-radios__item">
          <input class="govuk-radios__input"
                 type="radio" id="area-mainstream"
                 name="area"
            ${state.areaToSearch === 'mainstream' ? 'checked' : ''}/>
          <label for="area-mainstream" class="govuk-label govuk-radios__label">
            Mainstream Publisher&nbsp;${viewInfoButton('mainstream')}
          </label>
        </div>
        <div class="govuk-radios__item">
          <input class="govuk-radios__input"
                 type="radio" id="area-whitehall"
                 name="area"
            ${state.areaToSearch === 'whitehall' ? 'checked' : ''}/>
          <label for="area-whitehall" class="govuk-label govuk-radios__label">Whitehall</label>
        </div>
        <div class="govuk-radios__item">
          <input class="govuk-radios__input"
                 type="radio" id="area-any"
                 name="area"
            ${state.areaToSearch === 'any' ? 'checked' : ''}/>
          <label for="area-any" class="govuk-label govuk-radios__label">All publishing applications</label>
        </div>
      </div>
    </fieldset>
  </div>
  `;
};

const viewInfoButton = id => `
  <img class="info-button" id="info-button-${id}" src="assets/images/question-mark.svg" alt="question mark"/>
`;

const viewTaxonSelector = () => `
  <div class="govuk-body">
    <div class="taxon-facet">
      <label class="govuk-label label--bold" for="taxon-label">
        Taxon&nbsp;${viewInfoButton('taxon')}
      </label>
      <datalist id="taxonList">
        ${state.taxons.map(taxon => `<option>${taxon}</option>`)}
      </datalist>
      <div>
      <input
        ${state.waiting && 'disabled="disabled"'}
        style="display: inline-block"
        list="taxonList"
        value="${state.selectedTaxon}"
        class="govuk-input"
        id="taxon"
        autocomplete="off" />
      </div>
    </div>
  </div>
`;

const viewLocaleSelector = () => {
  const html = [`
    <div class="govuk-body taxon-facet">
      <label class="govuk-label label--bold" for="locale">
        Search by language
      </label>
      <datalist id="localeList">
  `];
  html.push(...state.locales.map(code => `<option data-value="${code}" ${state.selectedLocale==code ? 'selected' : ''}>${languageName(code)}</option>`))
  html.push(`
      </datalist>
      <input type="text"
         ${state.waiting && 'disabled="disabled"'}
         value="${state.selectedLocale}"
         class="govuk-input"
         list="localeList"
         id="locale" name="locale"
         autocomplete="off" />
    </div>`);
  return html.join('');
};


const viewSearchButton = () => `
  <p class="govuk-body">
    <button
      type="submit"
      class="govuk-button ${state.waiting?'govuk-button--disabled':''}"
      ${state.waiting ? 'disabled="disabled"' : '' }
      id="search">
      ${state.waiting?'Searching':'Search'}
    </button>
    <button
      type="button"
      class="govuk-button govuk-button--secondary ${state.waiting?'govuk-button--disabled':''}"
      ${state.waiting ? 'disabled="disabled"' : '' }
      id="clear-filters">
      Clear all filters
    </button>


    ${state.waiting?'<br/><span class="govuk-body">Please note that some queries take up to one minute</span>':''}
  </p>
`;


const viewLinkSearch = () => `
  <div class="govuk-body">
    <label class="govuk-label label--bold" for="link-search">
      Link search&nbsp;${viewInfoButton('link')}
    </label>
    <div class="govuk-hint">
      For example: /maternity-pay-leave or youtube.com
    </div>
    <input
        class="govuk-input"
        id="link-search"
        ${state.waiting && 'disabled="disabled"'}
        value="${state.linkSearchUrl}"
     />
  </div>
`;

const viewSearchResultsTable = () => {
  const html = [];

  const recordsToShow = state.searchResults.records.slice(state.skip, state.skip + state.resultsPerPage);
  html.push(`
    <div class="govuk-body">
      <fieldset class="govuk-fieldset" ${state.waiting && 'disabled="disabled"'}>
        <legend class="govuk-fieldset__legend">Show with</legend>
        <ul class="kg-checkboxes" id="show-fields">`);
  html.push(recordsToShow[0].keys.map(key => `
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
        <tr class="govuk-table__row">`);

  recordsToShow[0].keys.forEach(key => {
    if (state.showFields[key]) {
      html.push(`<th scope="col" class="govuk-table__header">${fieldName(key)}</th>`);
    }
  });

  recordsToShow.forEach(record => {
    html.push(`<tr class="govuk-table__row">`);

    record._fields.forEach((val, idx) => {
      if (state.showFields[record.keys[idx]]) {
        html.push(`<td class="govuk-table__cell">${fieldFormat(record.keys[idx], val)}</td>`);
      }
    });
    html.push(`</tr>`);
  });
  html.push(`
        </tbody>
      </table>
    </div>`);
  return html.join('');
}


const csvFromResults = function(searchResults) {
  const csv = [];
  if (searchResults && searchResults.records.length > 0) {
    // column headings:
    csv.push(searchResults.records[0].keys.map(fieldName).join())
    // rows:
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


const viewWaiting = function() {
  document.title = 'Searching - GovGraph search';

  return `
      <h2 class="govuk-heading-l">Please wait <img src="assets/images/loader.gif" height="20px" alt="loader"/></h2>
      <div class="govuk-body">Searching for ${viewQueryDescription()}</div>
      <p class="govuk-body-s">Please note that some queries take up to one minute</p>`;
};


const viewMetaStatementList = function(records, edgeTypeCode, edgeTypeName, targetIndex, targetField) {
  const statementsOfInterest = records.filter(record => record._fields[1].type == edgeTypeCode);
  let statementsHtml = '';
  if (statementsOfInterest.length > 0) {
    const statementListItems = statementsOfInterest
      .map(statement => `<li>${statement._fields[targetIndex].properties[targetField]}</li>`)
      .join('');
    statementsHtml = `<p>${edgeTypeName}:</p><ul>${statementListItems}</ul>`;
  }
  return statementsHtml;
}


const viewResults = function() {
  const html = [];
  const nbRecords = state.searchResults.records.length;
  document.title = `GOV.UK ${viewQueryDescription(false)} - GovGraph search`;

  if (state.metaSearchResults.length > 0) {
    html.push(viewMetaResults());
  }

  if (nbRecords < state.nbResultsLimit) {
    html.push(`
      <h2 class="govuk-heading-l">${nbRecords} result${nbRecords!==0 ? 's' : ''}</h2>`);
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

  html.push(`<div class="govuk-body">for ${viewQueryDescription()}&nbsp;${viewInfoButton('popularity')}</div>`);

  if (nbRecords >= state.resultsPerPage) {
    html.push(`
      <p class="govuk-body">Showing results ${state.skip + 1} to ${Math.min(nbRecords, state.skip + state.resultsPerPage)}</p>`);
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
      <p class="govuk-body"><a class="govuk-link" href="${url}" download="export.csv">Download all data in CSV</a></p>`);
  return html.join('');
};

const viewNoResults = () => {
  document.title = `GOV.UK ${viewQueryDescription(false)} - GovGraph search`;
  return `
    <h2 class="govuk-heading-l">No results</h2>
    <div class="govuk-body">for ${viewQueryDescription()}</div>
  `;
};

const viewSearchResults = () => {
  switch(searchState().code) {
  case 'waiting': return viewWaiting();
  case 'results': return viewResults();
  case 'no-results': return viewNoResults();
  default: return '';
  }
};


// Remove duplicates - but should be fixed in cypher
const formatNames = array => [...new Set(array)].join(', ')
const formatDateTime = date => `${date.slice(0,10)}<br/>${date.slice(12, 16)}`;


const fieldFormatters = {
  'url' : {
    name: 'URL',
    format: url => `<a href="${url}">${url}</a>`
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
    format: date => date ? formatDateTime(date) : "Not withdrawn"
  },
  'withdrawn_explanation' : {
    name: 'Withdrawn reason',
    format: text => text || 'n/a'
  }
};

const fieldName = function(key) {
  const f = fieldFormatters[key];
  return f ? f.name : key;
}

const fieldFormat = function(key, val) {
  const f = fieldFormatters[key];
  return (f && f.format) ? f.format(val) : val;
}


const viewCrownSymbol = () => `
<svg role="presentation" focusable="false" class="gem-c-modal-dialogue__logotype-crown" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 132 97" height="26" width="30">
        <path fill="currentColor" fill-rule="evenodd" d="M25 30.2c3.5 1.5 7.7-.2 9.1-3.7 1.5-3.6-.2-7.8-3.9-9.2-3.6-1.4-7.6.3-9.1 3.9-1.4 3.5.3 7.5 3.9 9zM9 39.5c3.6 1.5 7.8-.2 9.2-3.7 1.5-3.6-.2-7.8-3.9-9.1-3.6-1.5-7.6.2-9.1 3.8-1.4 3.5.3 7.5 3.8 9zM4.4 57.2c3.5 1.5 7.7-.2 9.1-3.8 1.5-3.6-.2-7.7-3.9-9.1-3.5-1.5-7.6.3-9.1 3.8-1.4 3.5.3 7.6 3.9 9.1zm38.3-21.4c3.5 1.5 7.7-.2 9.1-3.8 1.5-3.6-.2-7.7-3.9-9.1-3.6-1.5-7.6.3-9.1 3.8-1.3 3.6.4 7.7 3.9 9.1zm64.4-5.6c-3.6 1.5-7.8-.2-9.1-3.7-1.5-3.6.2-7.8 3.8-9.2 3.6-1.4 7.7.3 9.2 3.9 1.3 3.5-.4 7.5-3.9 9zm15.9 9.3c-3.6 1.5-7.7-.2-9.1-3.7-1.5-3.6.2-7.8 3.7-9.1 3.6-1.5 7.7.2 9.2 3.8 1.5 3.5-.3 7.5-3.8 9zm4.7 17.7c-3.6 1.5-7.8-.2-9.2-3.8-1.5-3.6.2-7.7 3.9-9.1 3.6-1.5 7.7.3 9.2 3.8 1.3 3.5-.4 7.6-3.9 9.1zM89.3 35.8c-3.6 1.5-7.8-.2-9.2-3.8-1.4-3.6.2-7.7 3.9-9.1 3.6-1.5 7.7.3 9.2 3.8 1.4 3.6-.3 7.7-3.9 9.1zM69.7 17.7l8.9 4.7V9.3l-8.9 2.8c-.2-.3-.5-.6-.9-.9L72.4 0H59.6l3.5 11.2c-.3.3-.6.5-.9.9l-8.8-2.8v13.1l8.8-4.7c.3.3.6.7.9.9l-5 15.4v.1c-.2.8-.4 1.6-.4 2.4 0 4.1 3.1 7.5 7 8.1h.2c.3 0 .7.1 1 .1.4 0 .7 0 1-.1h.2c4-.6 7.1-4.1 7.1-8.1 0-.8-.1-1.7-.4-2.4V34l-5.1-15.4c.4-.2.7-.6 1-.9zM66 92.8c16.9 0 32.8 1.1 47.1 3.2 4-16.9 8.9-26.7 14-33.5l-9.6-3.4c1 4.9 1.1 7.2 0 10.2-1.5-1.4-3-4.3-4.2-8.7L108.6 76c2.8-2 5-3.2 7.5-3.3-4.4 9.4-10 11.9-13.6 11.2-4.3-.8-6.3-4.6-5.6-7.9 1-4.7 5.7-5.9 8-.5 4.3-8.7-3-11.4-7.6-8.8 7.1-7.2 7.9-13.5 2.1-21.1-8 6.1-8.1 12.3-4.5 20.8-4.7-5.4-12.1-2.5-9.5 6.2 3.4-5.2 7.9-2 7.2 3.1-.6 4.3-6.4 7.8-13.5 7.2-10.3-.9-10.9-8-11.2-13.8 2.5-.5 7.1 1.8 11 7.3L80.2 60c-4.1 4.4-8 5.3-12.3 5.4 1.4-4.4 8-11.6 8-11.6H55.5s6.4 7.2 7.9 11.6c-4.2-.1-8-1-12.3-5.4l1.4 16.4c3.9-5.5 8.5-7.7 10.9-7.3-.3 5.8-.9 12.8-11.1 13.8-7.2.6-12.9-2.9-13.5-7.2-.7-5 3.8-8.3 7.1-3.1 2.7-8.7-4.6-11.6-9.4-6.2 3.7-8.5 3.6-14.7-4.6-20.8-5.8 7.6-5 13.9 2.2 21.1-4.7-2.6-11.9.1-7.7 8.8 2.3-5.5 7.1-4.2 8.1.5.7 3.3-1.3 7.1-5.7 7.9-3.5.7-9-1.8-13.5-11.2 2.5.1 4.7 1.3 7.5 3.3l-4.7-15.4c-1.2 4.4-2.7 7.2-4.3 8.7-1.1-3-.9-5.3 0-10.2l-9.5 3.4c5 6.9 9.9 16.7 14 33.5 14.8-2.1 30.8-3.2 47.7-3.2z"></path>
        <image src="/assets/govuk-logotype-crown-66ad9a9b8fca42cf0ba18979eef6afc2e8056d5f158ca9b27ce9afdf852aae87.png" class="gem-c-modal-dialogue__logotype-crown-fallback-image"></image>
      </svg>`;



export { view };
