/* global accessibleAutocomplete */
/*eslint no-unused-vars: ["error", { "varsIgnorePattern": "view" }]*/

import { id, sanitise } from './utils.js';
import { state, searchState } from './state.js';
import { handleEvent } from './events.js';


const view = () => {
  console.log('view')
  id('page-content').innerHTML = `
    <main class="govuk-main-wrapper " id="main-content" role="main">
      ${viewBanner()}
      ${viewError()}
      <div class="govuk-grid-row">
        <div class="govuk-grid-column-one-third">
          ${viewSearchPanel()}
        </div>
        <div class="govuk-grid-column-two-thirds">
          ${viewSearchResults(state.searchResults, state.showFields)}
        </div>
      </div>
      ${viewCypherQuery()}
    </main>
  `;

  document.querySelectorAll('button, input[type=checkbox][data-interactive=true]')
    .forEach(input => input.addEventListener(
      'click',
      event => handleEvent({type: 'dom', id: event.target.getAttribute('id')})));

  document.getElementById('search-form').addEventListener(
    'submit',
    event => {
      event.preventDefault();
      handleEvent({type: 'dom', id: 'search'});
    }
  );

  // add the accessible autocomplete
  if (id('taxon')) {
    accessibleAutocomplete({
      element: document.querySelector('#taxon'),
      id: 'taxon-label',
      source: state.taxons,
      placeholder: 'All taxons',
      defaultValue: state.selectedTaxon,
      showAllValues: true
    });
  }
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
  includeMarkup ? `<span class="govuk-!-font-weight-bold">${text}</span>` : text;


const viewContainDescription = (words, includeMarkup) => {
  let where;
  if (state.whereToSearch.title && state.whereToSearch.text) {
    where = '';
  } else if (state.whereToSearch.title) {
    where = 'in their title';
  } else {
    where = 'in their body content';
  }

  return words !== '' ? `${makeBold(words, includeMarkup)} ${where}` : '';
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
    clauses.push(`are in ${makeBold(localeNames[state.selectedLocale], includeMarkup)}`);
  if (state.linkSearchUrl !== '')
    clauses.push(`link to ${makeBold(state.linkSearchUrl, includeMarkup)}`);
  if (state.areaToSearch === 'whitehall' || state.areaToSearch === 'mainstream')
    clauses.push(`are published using ${makeBold(state.areaToSearch, includeMarkup)}`);

  const joinedClauses = (clauses.length === 1) ?
    clauses[0] :
    `${clauses.slice(0, clauses.length - 1).join(', ')} and ${clauses[clauses.length - 1]}`;

  return `pages that ${joinedClauses}`;

};


const viewError = () =>
  state.errorText ? `
  <div class="govuk-error-summary" aria-labelledby="error-summary-title" role="alert" tabindex="-1" data-module="govuk-error-summary">
    <h2 class="govuk-error-summary__title" id="error-summary-title">Error</h2>
    <p class="govuk-body">${state.errorText}</p>
  </div>
` : '';


const viewSearchPanel = () => `
  <form id="search-form" class="search-panel govuk-form">
    <div class="search-mode-panel">
      ${viewKeywordsInput()}
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
    <label for="keyword" class="govuk-label label--bold">Search for</label>
    <div class="govuk-hint">
      For example: cat, dog, &quot;health certificate&quot;
    </div>
    <input class="govuk-input" id="keyword" value='${sanitise(state.selectedWords).replace('"', '&quot;')}'/>
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
  const err = searchState() === 'missingWhereToSearch';
  return `
  <div class="govuk-form-group ${err ? 'govuk-form-group--error' : ''}">
    <fieldset class="govuk-fieldset" id="search-locations-wrapper" aria-describedby="scope-hint ${err ? 'scope-error' : ''}">
      <legend class="govuk-fieldset__legend">
        Keyword location
      </legend>
      <div id="scope-hint" class="govuk-hint">
        Select all that apply
      </div>
      ${err ? viewInlineError('scope-error', 'Please choose at least one option') : ''}
      <div class="govuk-checkboxes" id="search-locations">
        <div class="govuk-checkboxes__item">
          <input class="govuk-checkboxes__input"
                 type="checkbox" id="search-title"
            ${state.whereToSearch.title ? 'checked' : ''}/>
          <label for="search-title" class="govuk-label govuk-checkboxes__label">title</label>
        </div>
        <div class="govuk-checkboxes__item">
          <input class="govuk-checkboxes__input"
                 type="checkbox" id="search-text"
            ${state.whereToSearch.text ? 'checked' : ''}/>
          <label for="search-text" class="govuk-label govuk-checkboxes__label">body content</label>
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
        <input class="govuk-checkboxes__input"
               type="checkbox" id="case-sensitive"
          ${state.caseSensitive ? 'checked' : ''}/>
        <label for="case-sensitive" class="govuk-label govuk-checkboxes__label">case-sensitive search</label>
      </div>
    </div>
  </div>
`;


const viewPublishingAppSelector = () => {
  const err = searchState() === 'missingArea';
  return `
  <div class="govuk-form-group ${err ? 'govuk-form-group--error' : ''}">
    <fieldset class="govuk-fieldset" id="search-areas-wrapper" aria-describedby="area-hint ${err ? 'area-error' : ''}">
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
          <label for="area-mainstream" class="govuk-label govuk-radios__label">Mainstream</label>
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

const viewTaxonSelector = () => `
  <div class="govuk-body">
    <div class="taxon-facet">
      <label class="govuk-label label--bold" for="taxon-label">Search in taxon and its sub-taxons</label>
      <div id="taxon"></div>
    </div>
  </div>
`;


const viewSearchButton = () => `
  <p class="govuk-body">
    <button
      class="govuk-button ${state.waiting?'govuk-button--secondary':''}"
      id="search">
      ${state.waiting?'Searching':'Search'}
    </button>
    ${state.waiting?'<br/><span class="govuk-body">Please note that some queries take up to one minute</span>':''}
  </p>
`;


const viewLinkSearch = () => `
  <div class="govuk-body">
    <label class="govuk-label label--bold" for="link-search">
      Link search
    </label>
    <div class="govuk-hint">
      For example: /maternity-pay-leave or youtube.com
    </div>
    <input class="govuk-input" id="link-search"
           value="${state.linkSearchUrl}"/>
  </div>
`;


const viewLocaleSelector = () => {
  const html = [`
    <div class="govuk-body taxon-facet">
      <label class="govuk-label label--bold" for="locale">
        Search by language
      </label>
      <select id="locale" class="govuk-select">
  `];
  html.push(...state.locales.map(code => `<option name="${code}" ${state.selectedLocale==code ? 'selected' : ''}>${localeNames[code]}</option>`))
  html.push('</select></div>');
  return html.join('');
};


const viewSearchResultsTable = () => {
  const html = [];

  const recordsToShow = state.searchResults.records.slice(state.skip, state.skip + state.resultsPerPage);
  html.push(`
    <div class="govuk-body">
      <fieldset class="govuk-fieldset">
        <legend class="govuk-fieldset__legend">Show</legend>
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


const viewWaiting = function() {
  document.title = 'Searching - GovGraphSearch';

  return `
      <h2 class="govuk-heading-l">Please wait <img src="assets/images/loader.gif" height="20px" alt="loader"/></h2>
      <div class="govuk-body">Searching for ${viewQueryDescription()}</div>
      <p class="govuk-body-s">Please note that some queries take up to one minute</p>`;
};

const viewResults = function() {
  const html = [];
  const nbRecords = state.searchResults.records.length;
  document.title = `GOV.UK ${viewQueryDescription(false)} - GovGraphSearch`;

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

  html.push(`<div class="govuk-body-s">for ${viewQueryDescription()}</div>`);

  if (nbRecords >= state.resultsPerPage) {
    html.push(`
      <p class="govuk-body">Showing results ${state.skip + 1} to ${Math.min(nbRecords, state.skip + state.resultsPerPage)}</p>`);
  }
  html.push(viewSearchResultsTable());

  if (nbRecords >= state.resultsPerPage) {
    html.push(`
      <p class="govuk-body">
        <button class="govuk-button" id="button-prev-page">Previous</button>
        <button class="govuk-button" id="button-next-page">Next</button>
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
  document.title = `GOV.UK ${viewQueryDescription(false)} - GovGraphSearch`;
  return `
    <h2 class="govuk-heading-l">No results</h2>
    <div class="govuk-body">for ${viewQueryDescription()}</div>
  `;
};

const viewSearchResults = () => {
  switch(searchState()) {
  case 'waiting': return viewWaiting();
  case 'results': return viewResults();
  case 'no-results': return viewNoResults();
  default: return '';
  }
};

const viewCypherQuery = () => {
  const html = [];
  // Print the cypher query used, for the advanced user
  if (state.searchQuery.length > 0) {
    html.push(`
      <div id="cypher-query">
      <hr/><h2 class="govuk-heading-s">Cypher query (for debugging)</h2>
      <pre>${state.searchQuery}</pre>
    `);
  }
  return html.join('');
};

const viewTooltip = (text) => {
  return `
    <span class="keyword-label has-tooltip">
      <img class="has-tooltip" src="assets/images/question-mark.svg" height="15px"/>
      <p class="tooltip-text">${text}</p>
   </span>`;
};


// Remove duplicates - but should be fixed in cypher
const formatNames = array => [...new Set(array)].join(', ')
const formatDateTime = date => `${date.slice(0,10)}<br/>${date.slice(12, 16)}`;
const formatLanguageCode = code => localeNames[code] || code;

const fieldFormatters = {
  'url' : {
    name: 'URL',
    format: url => `<a href="${url}">${url}</a>`
  },
  'title': { name: 'Title' },
  'locale': { name: 'Language', format: formatLanguageCode },
  'documentType': { name: 'Document type' },
  'publishing_app': { name: 'Publishing app' },
  'first_published_at' : {
    name: 'First published',
    format: formatDateTime
  },
  'public_updated_at' : {
    name: 'Last publicly updated',
    format: formatDateTime,
  },
  'taxons' : {
    name: 'Taxons',
    format: formatNames
  },
  'primary_organisation' : {
    name: 'Primary Organisation',
    format: formatNames
  },
  'all_organisations' : {
    name: 'Organisations',
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


// IETF language codes https://en.wikipedia.org/wiki/IETF_language_tag
const localeNames = {
  '': 'All languages',
  'af': 'Afrikaans',
  'am': 'Amharic',
  'ar': 'Arabic',
  'arn': 'Mapudungun',
  'as': 'Assamese',
  'az': 'Azeri',
  'ba': 'Bashkir',
  'be': 'Belarusian',
  'bg': 'Bulgarian',
  'bn': 'Bengali',
  'bo': 'Tibetan',
  'br': 'Breton',
  'bs': 'Bosnian',
  'ca': 'Catalan',
  'co': 'Corsican',
  'cs': 'Czech',
  'cy': 'Welsh',
  'da': 'Danish',
  'de': 'German',
  'dr': 'Dari', // Not an official iso code
  'dsb': 'Lower Sorbian',
  'dv': 'Divehi',
  'el': 'Greek',
  'en': 'English',
  'es': 'Spanish',
  'es-419': 'Latin-american Spanish',
  'et': 'Estonian',
  'eu': 'Basque',
  'fa': 'Persian',
  'fi': 'Finnish',
  'fil': 'Filipino',
  'fo': 'Faroese',
  'fr': 'French',
  'fy': 'Frisian',
  'ga': 'Irish',
  'gd': 'Scottish Gaelic',
  'gl': 'Galician',
  'gsw': 'Alsatian',
  'gu': 'Gujarati',
  'ha': 'Hausa',
  'he': 'Hebrew',
  'hi': 'Hindi',
  'hr': 'Croatian',
  'hsb': 'Upper Sorbian',
  'hu': 'Hungarian',
  'hy': 'Armenian',
  'id': 'Indonesian',
  'ig': 'Igbo',
  'ii': 'Yi',
  'is': 'Icelandic',
  'it': 'Italian',
  'iu': 'Inuktitut',
  'ja': 'Japanese',
  'ka': 'Georgian',
  'kk': 'Kazakh',
  'kl': 'Greenlandic',
  'km': 'Khmer',
  'kn': 'Kannada',
  'ko': 'Korean',
  'kok': 'Konkani',
  'ky': 'Kyrgyz',
  'lb': 'Luxembourgish',
  'lo': 'Lao',
  'lt': 'Lithuanian',
  'lv': 'Latvian',
  'mi': 'Maori',
  'mk': 'Macedonian',
  'ml': 'Malayalam',
  'mn': 'Mongolian',
  'moh': 'Mohawk',
  'mr': 'Marathi',
  'ms': 'Malay',
  'mt': 'Maltese',
  'my': 'Burmese',
  'nb': 'Norwegian (Bokmål)',
  'ne': 'Nepali',
  'nl': 'Dutch',
  'nn': 'Norwegian (Nynorsk)',
  'no': 'Norwegian',
  'nso': 'Sesotho',
  'oc': 'Occitan',
  'or': 'Oriya',
  'pa': 'Punjabi',
  'pl': 'Polish',
  'prs': 'Dari',
  'ps': 'Pashto',
  'pt': 'Portuguese',
  'qut': 'K\'iche',
  'quz': 'Quechua',
  'rm': 'Romansh',
  'ro': 'Romanian',
  'ru': 'Russian',
  'rw': 'Kinyarwanda',
  'sa': 'Sanskrit',
  'sah': 'Yakut',
  'se': 'Sami (Northern)',
  'si': 'Sinhala',
  'sk': 'Slovak',
  'sl': 'Slovenian',
  'sma': 'Sami (Southern)',
  'smj': 'Sami (Lule)',
  'smn': 'Sami (Inari)',
  'sms': 'Sami (Skolt)',
  'sq': 'Albanian',
  'sr': 'Serbian',
  'sv': 'Swedish',
  'sw': 'Kiswahili',
  'syr': 'Syriac',
  'ta': 'Tamil',
  'te': 'Telugu',
  'tg': 'Tajik',
  'th': 'Thai',
  'tk': 'Turkmen',
  'tn': 'Setswana',
  'tr': 'Turkish',
  'tt': 'Tatar',
  'tzm': 'Tamazight',
  'ug': 'Uyghur',
  'uk': 'Ukrainian',
  'ur': 'Urdu',
  'uz': 'Uzbek',
  'vi': 'Vietnamese',
  'wo': 'Wolof',
  'xh': 'isiXhosa',
  'yo': 'Yoruba',
  'zh': 'Chinese',
  'zh-tw': 'Taiwan Chinese',
  'zu': 'isiZulu'
}

export { view };
