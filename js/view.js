/* global accessibleAutocomplete */
/*eslint no-unused-vars: ["error", { "varsIgnorePattern": "view" }]*/

import { id, sanitise } from './utils.js';
import { state } from './state.js';
import { handleEvent } from './events.js';

const view = function() {
  console.log('view')
  const html = [];
  html.push(`
    <main class="govuk-main-wrapper " id="main-content" role="main">
      <strong class="govuk-tag govuk-phase-banner__content__tag">DISCOVERY</strong>
      <h1 class="govuk-heading-xl">
        GovGraph search
        <p class="govuk-heading-m">Search GOV.UK by keywords, links, taxons, etc.</p>
      </h1>`);

  if (state.errorText) {
    html.push(`
      <div class="govuk-error-summary" aria-labelledby="error-summary-title" role="alert" tabindex="-1" data-module="govuk-error-summary">
        <h2 class="govuk-error-summary__title" id="error-summary-title">Error</h2>
        <p class="govuk-body">${state.errorText}</p>
      </div>`);
    }

  html.push(viewSearchPanel());
  html.push(viewSearchResults(state.activeMode, state.searchResults, state.showFields));
  html.push(viewCypherQuery());
  html.push(`
    </main>`);

  id('page-content').innerHTML = html.join('');

  // adding onclick doesn't work
  document.querySelectorAll('button, input[type=checkbox][data-interactive=true]')
    .forEach(input => input.addEventListener(
      'click',
      event => handleEvent({type: 'dom', id: event.target.getAttribute('id')})));

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

const viewSearchPanel = function() {
  const html = [];
  html.push(`
    <div class="search-panel">
      <p class="govuk-body mode-buttons">
        <button class="${state.activeMode==='keyword-search'?'search-active':''}" id="button-select-keyword-search">
          Keyword search
        </button>
        <button class="${state.activeMode==='link-search'?'search-active':''}" id="button-select-link-search">
          Link search
        </button>
      </p>
      <div class="search-mode-panel">`);

  switch(state.activeMode) {
  case 'keyword-search':
    html.push(viewKeywordSearchPanel());
    break;

  case 'link-search':
    html.push(viewLinkSearchPanel());
    break;

  default:
    console.log('invalid mode', state.activeMode);
  }
  html.push(`
      </div>
      <div ckass="sig">
        <p class="govuk-body">Brought to you by the Data Labs</p>
        <p class="govuk-body">Help/problem/feedback: Contact <a href="mailto:max.froumentin@digital.cabinet-office.gov.uk">Max Froumentin</a></p>
      </div>
    </div>`);
  return html.join('');
};


const viewKeywordSearchPanel = function() {
  const html = [];
  html.push(`
    <div class="govuk-body">
      Keywords:
      <input class="govuk-input" id="keyword" placeholder="eg: cat dog &quot;health certificate&quot;" value='${sanitise(state.selectedWords).replace('"', '&quot;')}'/>
    </div>
    <div class="govuk-body">
      Exclude keywords:
      <input class="govuk-input" id="excluded-keyword" placeholder="leave blank if no exclusions" value='${sanitise(state.excludedWords).replace('"', '&quot;')}'/>
    </div>
    <div class="govuk-body">
      <div class="kg-checkboxes">
        <div class="kg-checkboxes__item">
          <input class="kg-checkboxes__input"
                 type="checkbox" id="case-sensitive"
            ${state.caseSensitive ? 'checked' : ''}/>
          <label class="kg-label kg-checkboxes__label">Case-sensitive search</label>
        </div>
      </div>
    </div>
    <div class="govuk-body">
      <div id="search-locations-wrapper">
        Search in:
        <ul class="kg-checkboxes" id="search-locations">
          <li class="kg-checkboxes__item">
            <input class="kg-checkboxes__input"
                   type="checkbox" id="search-title"
              ${state.whereToSearch.title ? 'checked' : ''}/>
            <label class="kg-label kg-checkboxes__label">Page title</label>
          </li>
          <li class="kg-checkboxes__item">
            <input class="kg-checkboxes__input"
                   type="checkbox" id="search-text"
              ${state.whereToSearch.text ? 'checked' : ''}/>
            <label class="kg-label kg-checkboxes__label">Page text</label>
          </li>
        </ul>
      </div>
    </div>
    <div class="govuk-body">
      <div id="search-areas-wrapper">
        Limit to:
        <ul class="kg-radios" id="site-areas">
          <li class="kg-radios__item">
            <input class="kg-radios__input"
                   type="radio" id="area-mainstream"
                   name="area"
              ${state.areaToSearch === 'mainstream' ? 'checked' : ''}/>
            <label class="kg-label kg-radios__label">Mainstream</label>
          </li>
          <li class="kg-radios__item">
            <input class="kg-radios__input"
                   type="radio" id="area-whitehall"
                   name="area"
              ${state.areaToSearch === 'whitehall' ? 'checked' : ''}/>
            <label class="kg-label kg-radios__label">Whitehall</label>
          </li>
          <li class="kg-radios__item">
            <input class="kg-radios__input"
                   type="radio" id="area-any"
                   name="area"
              ${state.areaToSearch === '' ? 'checked' : ''}/>
            <label class="kg-label kg-radios__label">Any</label>
          </li>
        </ul>
      </div>
    </div>
    <div class="govuk-body">
      <div class="taxon-facet">
        Search in taxon:
        <div id="taxon"></div>
      </div>
    </div>
    ${viewLocaleSelector()}
    <p class="govuk-body">
      <button
class="govuk-button ${state.waiting?'govuk-button--secondary':''}"
id="keyword-search">
        ${state.waiting?'Searching':'Search'}
      </button>
    </p>`);

  return html.join('');
};


const viewLocaleSelector = function() {
  const html = [`
    <div class="govuk-body taxon-facet">
      Search by language:
      <select id="locale" class="govuk-select">
  `];
  html.push(...state.locales.map(code => `<option name="${code}" ${state.selectedLocale==code ? 'selected' : ''}>${localeNames[code]}</option>`))
  html.push('</select></div>');
  return html.join('');
};


const viewLinkSearchPanel = function() {
  const html = [];
  html.push(`
    <p class="govuk-body">Enter a URL to find all pages linking to it</p>
    <div class="govuk-hint">
      For instance: '/maternity-pay-leave' or 'youtube.com'
    </div>

    <div id="link-search-panel">
      <p class="govuk-body">
        <input class="govuk-input" id="link-search"
               value="${state.linkSearchUrl}"/>
      </p>
      <p class="govuk-body">
        <button
            class="govuk-button ${state.waiting?'govuk-button--secondary':''}"
            id="link-search">
          ${state.waiting?'Searching':'Search'}
        </button>
      </p>
    </div>`);

  return html.join('');
};


const viewSearchResultsTable = function(records, showFields) {
  const html = [];
  const recordsToShow = records.slice(state.skip, state.skip + state.resultsPerPage);
  html.push(`
    <div class="govuk-body">
      Show:
      <ul class="kg-checkboxes" id="show-fields">`);
  html.push(recordsToShow[0].keys.map(key => `
        <li class="kg-checkboxes__item">
          <input class="kg-checkboxes__input"
                 data-interactive="true"
                 type="checkbox" id="show-field-${key}"
            ${showFields[key] ? 'checked' : ''}/>
          <label class="kg-label kg-checkboxes__label">${fieldName(key)}</label>
        </li>`).join(''));
  html.push(`
      </ul>
      <table id="results-table" class="govuk-table">
        <tbody class="govuk-table__body">
        <tr class="govuk-table__row">`);

  recordsToShow[0].keys.forEach(key => {
    if (state.showFields[key]) {
      html.push(`<th scope="scope" class="govuk-table__header">${fieldName(key)}</th>`);
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


const viewSearchResults = function(mode, results, showFields) {
  const html = [];
  html.push(`
    <div id="results">`);
  if (state.waiting) {
    html.push(`
      <h2 class="govuk-heading-l">Searching, please wait <img src="assets/images/loader.gif" height="20px" alt="loader"/></h2>`);
  } else if (results && results.records.length > 0) {
    const nbRecords = results.records.length;
    if (nbRecords < state.nbResultsLimit) {
      html.push(`
      <h2 class="govuk-heading-l">${nbRecords} result${nbRecords!==0 ? 's' : ''}</h2>`);
    } else {
      html.push(`
      <h2 class="govuk-heading-l">Results</h2>
      <h3 class="govuk" class="govuk-heading-m">Note: this query returned more than ${state.nbResultsLimit} results. Try to narrow down your search.</h3>
      `);
    }

    if (nbRecords >= state.resultsPerPage) {
      html.push(`
      <p class="govuk-body">Showing ${state.skip + 1} - ${Math.min(nbRecords, state.skip + state.resultsPerPage)}</p>`);
    }
    html.push(viewSearchResultsTable(results.records, showFields));

    if (nbRecords >= state.resultsPerPage) {
      html.push(`
      <p class="govuk-body">
        <button class="govuk-button" id="button-prev-page">Previous</button>
        <button class="govuk-button" id="button-next-page">Next</button>
      </p>`);
    }

    const csv = csvFromResults(results);
    const file = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(file); // TODO: use window.URL.revokeObjectURL(url);  after
    html.push(`
      <p class="govuk-body"><a class="govuk-link" href="${url}" download="export.csv">Save all ${nbRecords} results as a CSV file</a></p>`);

  } else if (results && results.records.length == 0) {
    html.push(`
      <h2 class="govuk-heading-l">No results</h2>`);
  }
  html.push(`
    </div>`);
  return html.join('');
};

const viewCypherQuery = function() {
  const html = [];
  // Print the cypher query used, for the advanced user
  if (state.searchQuery.length > 0) {
    html.push(`
      <div id="cypher-query">
      <hr/><h2 class="govuk-heading-s">Cypher query (for debugging):</h2>
      <pre>${state.searchQuery}</pre>
    `);
  }
  return html.join('');
};

const viewTooltip = function(text) {
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
