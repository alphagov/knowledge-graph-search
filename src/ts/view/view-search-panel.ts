import { sanitiseOutput } from '../utils';
import { state, searchState } from '../state';
import { languageName } from '../lang';
import { SearchType } from '../state-types';


const viewSearchPanel = () => {
  const result = [];
  switch (state.searchType) {
    case SearchType.Mixed:
    case SearchType.Results:
      result.push(`
      <form id="search-form" class="search-panel govuk-form">
        <div class="search-mode-panel">
          <h1 class="govuk-heading-xl">Mixed search</h1>
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
      </form>
    `);
      break;
    case SearchType.Keyword:
      result.push(`
      <form id="search-form" class="search-panel govuk-form">
        <div class="search-mode-panel">
          <a class="govuk-skip-link" href="#results-table">Skip to results</a>
          ${viewKeywordsInput()}
          <details class="govuk-details" data-module="govuk-details">
            <summary class="govuk-details__summary">
              <span class="govuk-details__summary-text">
                Filters
              </span>
            </summary>
            <div class="govuk-details__text">
              ${viewKeywordsCombinator()}
              ${viewExclusionsInput()}
              ${viewCaseSensitiveSelector()}
              ${viewScopeSelector()}
              ${viewPublishingAppSelector()}
            </div>
          </details>
          ${viewSearchButton()}
        </div>
      </form>
    `);
      break;
    case SearchType.Link:
      result.push(`
      <form id="search-form" class="search-panel govuk-form">
        <div class="search-mode-panel">
          <a class="govuk-skip-link" href="#results-table">Skip to results</a>
          ${viewLinkSearch()}
          <details class="govuk-details" data-module="govuk-details">
            <summary class="govuk-details__summary">
              <span class="govuk-details__summary-text">
                Filters
              </span>
            </summary>
            <div class="govuk-details__text">
              ${viewPublishingAppSelector()}
            </div>
          </details>
          ${viewSearchButton()}
        </div>
      </form>
    `);
      break;
    case SearchType.Taxon:
      result.push(`
      <form id="search-form" class="search-panel govuk-form">
        <div class="search-mode-panel">
          <a class="govuk-skip-link" href="#results-table">Skip to results</a>
          ${viewTaxonSelector()}
          <details class="govuk-details" data-module="govuk-details">
            <summary class="govuk-details__summary">
              <span class="govuk-details__summary-text">
                Filters
              </span>
            </summary>
            <div class="govuk-details__text">
              ${viewPublishingAppSelector()}
            </div>
          </details>
          ${viewSearchButton()}
        </div>
      </form>
    `);
      break;
    case SearchType.Language:
      result.push(`
      <form id="search-form" class="search-panel govuk-form">
        <div class="search-mode-panel">
          <a class="govuk-skip-link" href="#results-table">Skip to results</a>
          ${viewLocaleSelector()}
          <details class="govuk-details" data-module="govuk-details">
            <summary class="govuk-details__summary">
              <span class="govuk-details__summary-text">
                Filters
              </span>
            </summary>
            <div class="govuk-details__text">
              ${viewPublishingAppSelector()}
            </div>
          </details>
          ${viewSearchButton()}
        </div>
      </form>
    `);
      break;
    default:
      console.log('viewSearchPanel: unknown value', state.searchType);
  }
  return result.join('');
};


const viewInlineError = (id: string, message: string): string => `
  <p id="${id}" class="govuk-error-message">
    <span class="govuk-visually-hidden">Error:</span> ${message}
  </p>
`;


const viewScopeSelector = (): string => {
  const errors = searchState()?.errors;
  const err = errors && errors.includes('missingWhereToSearch');
  return `
  <div class="govuk-form-group ${err ? 'govuk-form-group--error' : ''}">
    <fieldset
        class="govuk-fieldset"
        ${state.waiting && 'disabled="disabled"'}
        id="search-scope-wrapper"
        ${err ? 'aria-describedby="scope-error"' : ''}>
      <legend class="govuk-fieldset__legend">
        Keyword location
      </legend>
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
            body content and description
          </label>
        </div>
      </div>
    </fieldset>
  </div>
  `;
};


const viewTaxonSelector = () => `
  <div class="govuk-body">
    <div class="taxon-facet">
      <label class="govuk-label label--bold" for="taxon">
        Search for taxons
      </label>
      <div class="govuk-hint">
        Type the first letters of a taxon or select from the dropdown
      </div>
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
        Search for languages
      </label>
      <div class="govuk-hint">
        Type the first letters of a language or select from the dropdown
      </div>
      <datalist id="localeList">
  `];
  html.push(...state.locales.map(code => `<option data-value="${code}" ${state.selectedLocale == code ? 'selected' : ''}>${languageName(code)}</option>`))
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
      class="govuk-button ${state.waiting ? 'govuk-button--disabled' : ''}"
      ${state.waiting ? 'disabled="disabled"' : ''}
      id="search">
      ${state.waiting ? 'Searching <img src="assets/images/loader.gif" height="20px" alt="loader"/>' : 'Search'}
    </button>
  </p>
`;


const viewLinkSearch = () => `
  <div class="govuk-body">
    <label class="govuk-label label--bold" for="link-search">
      Search for links
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


const viewKeywordsCombinator = () =>
  ` <div class="govuk-form-group">
    <fieldset
        class="govuk-fieldset"
        id="combinator-wrapper"
        ${state.waiting && 'disabled="disabled"'}>

      <legend class="govuk-fieldset__legend">
        Search for
      </legend>
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


const viewPublishingAppSelector = () =>
  ` <div class="govuk-form-group">
    <fieldset
        class="govuk-fieldset"
        id="search-areas-wrapper"
        ${state.waiting && 'disabled="disabled"'}>
      <legend class="govuk-fieldset__legend">
        Limit search
      </legend>
      <div class="govuk-radios" id="site-areas">
        <div class="govuk-radios__item">
          <input class="govuk-radios__input"
                 type="radio" id="area-mainstream"
                 name="area"
            ${state.areaToSearch === 'mainstream' ? 'checked' : ''}/>
          <label for="area-mainstream" class="govuk-label govuk-radios__label">
            Mainstream Publisher
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


const viewKeywordsInput = () => `
  <div class="govuk-body">
    <label for="keyword" class="govuk-label label--bold">Search for keywords</label>
    <div class="govuk-hint">
      For example: cat, dog, &quot;Department for Education&quot;
    </div>
    <input
      ${state.waiting && 'disabled="disabled"'}
      class="govuk-input"
      id="keyword"
      value='${sanitiseOutput(state.selectedWords)}'
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
        value='${sanitiseOutput(state.excludedWords).replace('"', '&quot;')}'/>
  </div>
`;


export { viewSearchPanel };
