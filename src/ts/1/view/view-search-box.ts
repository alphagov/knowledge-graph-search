import { sanitiseOutput } from '../utils';
import { state, searchState } from '../state';
import { languageName } from '../lang';
import { SearchType } from '../search-api-types';


const viewSearchBox = () => {
  return `<form id="search-form" class="search-panel govuk-form">
    <div class="search-mode-panel">
      <a class="govuk-skip-link" href="#results-table">Skip to results</a>
      <h1 class="govuk-heading-l">Search GOV.UK Content</h1>
      ${viewKeywordsInput()}
    </div>
  </form>`;
};


const viewInlineError = (id: string, message: string): string => `
  <p id="${id}" class="govuk-error-message">
    <span class="govuk-visually-hidden">Error:</span> ${message}
  </p>
`;

const viewScopeSelector = (): string =>  state.searchParams.searchType !== 'link' ?
`
<div class="govuk-form-group">
 <fieldset
     class="govuk-fieldset"
     id="combinator-wrapper"
     ${state.waiting && 'disabled="disabled"'}>

   <legend class="govuk-fieldset__legend govuk-fieldset__legend--s">
     Keyword location
   </legend>
   <div class="govuk-radios govuk-radios--small" id="whereToSearch">
   <div class="govuk-radios__item">
     <input class="govuk-radios__input"
            type="radio" id="where-to-search-all"
            name="whereToSearch"
       ${state.searchParams.whereToSearch === 'all' ? 'checked' : ''}/>
     <label for="where-to-search-all" class="govuk-label govuk-radios__label">
       All keyword locations
     </label>
   </div>
   <div class="govuk-radios__item">
     <input class="govuk-radios__input"
            type="radio" id="where-to-search-title"
            name="whereToSearch"
       ${state.searchParams.whereToSearch === 'title' ? 'checked' : ''}/>
     <label for="where-to-search-title" class="govuk-label govuk-radios__label">
       Title
     </label>
   </div>
   <div class="govuk-radios__item">
     <input class="govuk-radios__input"
            type="radio" id="where-to-search-text"
            name="whereToSearch"
       ${state.searchParams.whereToSearch === 'text' ? 'checked' : ''}/>
     <label for="where-to-search-text" class="govuk-label govuk-radios__label">
       Body content and description
     </label>
   </div>
   </div>
 </fieldset>
</div>
  `: '';
const viewTaxonSelector = () => {

const html = [`
  <div class="govuk-form-group" data-state="${state.waiting && 'disabled'}">
    <label class="govuk-label govuk-label--s" for="taxon">
      Taxons
    </label>
    <select ${state.waiting && 'disabled="disabled"'} id="taxon" class="autocomplete__input autocomplete__input--default" name="taxon">
    <option value="all">All taxons</option>
`];

html.push(`
    ${html.push(...state.taxons.map(taxon => `<option value="${taxon}" ${state.searchParams.selectedTaxon == taxon ? 'selected' : ''}>${taxon}</option>`))}
      </select>
  </div>`);
return html.join('');

}


const viewLocaleSelector = () => {
  const html = [`
    <div class="govuk-form-group" data-state="${state.waiting && 'disabled'}">
      <label class="govuk-label govuk-label--s" for="locale">
        Languages
      </label>
      <select ${state.waiting && 'disabled="disabled"'} id="locale" class="autocomplete__input autocomplete__input--default" name="locale">
      <option value="all" >All languages</option>
  `];

  html.push(`
      ${html.push(...state.locales.map(code => `<option value="${code}" ${state.searchParams.selectedLocale == languageName(code) ? 'selected' : ''}>${languageName(code)}</option>`))}
        </select>
    </div>`);

  return html.join('');
};




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
        value="${state.searchParams.linkSearchUrl}"
     />
  </div>
`;


const viewCaseSensitiveSelector = () => `
  <div class="govuk-form-group">
    <div class="govuk-checkboxes govuk-checkboxes--small">
      <div class="govuk-checkboxes__item">
        <input
            class="govuk-checkboxes__input"
            ${state.waiting && 'disabled="disabled"'}
            type="checkbox"
            id="case-sensitive"
            ${state.searchParams.caseSensitive ? 'checked' : ''}
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
      <legend class="govuk-fieldset__legend govuk-fieldset__legend--s">
        Search for pages with
      </legend>
      <div class="govuk-radios govuk-radios--small" id="combinators">

        <div class="govuk-radios__item">
          <input class="govuk-radios__input"
                 type="radio" id="combinator-all"
                 name="combinator"
            ${state.searchParams.combinator === 'all' ? 'checked' : ''}
            />
          <label for="combinator-all" class="govuk-label govuk-radios__label">
            All keywords
          </label>
        </div>

        <div class="govuk-radios__item">
          <input class="govuk-radios__input"
                 type="radio" id="combinator-any"
                 name="combinator"
            ${state.searchParams.combinator === 'any' ? 'checked' : ''}
            />
          <label for="combinator-any" class="govuk-label govuk-radios__label">
            Any keyword
          </label>
        </div>

        <div class="govuk-radios__item">
          <input class="govuk-radios__input"
                 type="radio" id="combinator-notset"
                 name="combinator"
            ${state.searchParams.combinator === 'notset' ? 'checked' : ''}
            aria-describedby="pages-with-links-hint"
            />
          <label for="combinator-notset" class="govuk-label govuk-radios__label">
            Links
          </label>
          <div id="pages-with-links-hint" class="govuk-hint govuk-radios__hint govuk-!-font-size-16">
            Use slug or full URL, for example /tax-help or https://www.youtube.com
          </div>
        </div>
      </div>
    </fieldset>
  </div>
`;


const viewPublishingOrgSelector = () => {

const html = [`
  <div class="govuk-form-group" data-state="${state.waiting && 'disabled'}">
    <label class="govuk-label govuk-label--s" for="publishing-organisation">
      Publishing organisations
    </label>
    <select ${state.waiting && 'disabled="disabled"'} id="organisation" class="autocomplete__input autocomplete__input--default" name="publishing-organisation">
    <option value="all" >All publishing organisations</option>
`];

html.push(`
    ${html.push(...state.organisations.map(organisation => `<option value="${organisation}" ${state.searchParams.selectedOrganisation == organisation ? 'selected' : ''}>${organisation}</option>`))}
      </select>
  </div>`);
return html.join('');

}
 ;


const viewPublishingAppSelector = () =>
  ` <div class="govuk-form-group">
    <fieldset
        class="govuk-fieldset"
        id="search-areas-wrapper"
        ${state.waiting && 'disabled="disabled"'}>
      <legend class="govuk-fieldset__legend govuk-fieldset__legend--s">
        Publishing applications
      </legend>
      <div class="govuk-radios govuk-radios--small" id="site-areas">
        <div class="govuk-radios__item">
          <input class="govuk-radios__input"
                 type="radio" id="area-any"
                 name="area"
            ${state.searchParams.areaToSearch === 'any' ? 'checked' : ''}/>
          <label for="area-any" class="govuk-label govuk-radios__label">All publishing applications</label>
        </div>
        <div class="govuk-radios__item">
          <input class="govuk-radios__input"
                 type="radio" id="area-publisher"
                 name="area"
            ${state.searchParams.areaToSearch === 'publisher' ? 'checked' : ''}/>
          <label for="area-publisher" class="govuk-label govuk-radios__label">
            Publisher (mainstream)
          </label>
        </div>
        <div class="govuk-radios__item">
          <input class="govuk-radios__input"
                 type="radio" id="area-whitehall"
                 name="area"
            ${state.searchParams.areaToSearch === 'whitehall' ? 'checked' : ''}/>
          <label for="area-whitehall" class="govuk-label govuk-radios__label">
            Whithall (specialist)
          </label>
        </div>
      </div>
    </fieldset>
  </div>
`;


const viewKeywordsInput = () => `
<div class="gem-c-search govuk-!-display-none-print  gem-c-search--on-white" data-module="gem-toggle-input-class-on-focus" data-gem-toggle-input-class-on-focus-module-started="true">
  <label for="search" class="govuk-visually-hidden">Search</label>
  <div id="search-name-hint" class="govuk-hint">For an exact phrase use quotes for example, "UK driving licence"</div>
<div class="gem-c-search__item-wrapper" data-dashlane-rid="dbf92bc43833220c" data-form-type="">
  <input
  ${state.waiting && 'disabled="disabled"'}
  enterkeyhint="search" class="gem-c-search__item gem-c-search__input js-class-toggle" id="keyword" name="search" title="Search" type="search" aria-describedby="search-name-hint"
  value='${sanitiseOutput(state.searchParams.selectedWords) || sanitiseOutput(state.searchParams.linkSearchUrl)}' data-form-type="">
  <div class="gem-c-search__item gem-c-search__submit-wrapper">
    <button
    id="search"
    class="gem-c-search__submit ${state.waiting ? 'govuk-button--disabled' : ''}"
    ${state.waiting ? 'disabled="disabled"' : ''}
    type="submit"
    data-form-type="">
    <svg class="gem-c-search__icon" width="27" height="27" viewBox="0 0 27 27" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <circle cx="12.0161" cy="11.0161" r="8.51613" stroke="currentColor" stroke-width="3"></circle>
      <line x1="17.8668" y1="17.3587" x2="26.4475" y2="25.9393" stroke="currentColor" stroke-width="3"></line>
    </svg>
    </button>    </div>
      </div>
    </div>
`;


const viewExclusionsInput = () => `
  <div class="govuk-body">
    <label for="excluded-keyword" class="govuk-label govuk-label--s">
      Exclude keywords
    </label>
    <input class="govuk-input"
        ${state.waiting && 'disabled="disabled"'}
        id="excluded-keyword"
        value='${sanitiseOutput(state.searchParams.excludedWords).replace('"', '&quot;')}'/>
  </div>
`;

const viewPagesSelector = () => `
  <div class="govuk-form-group">
   <fieldset
       class="govuk-fieldset"
       id="pages-wrapper"
       ${state.waiting && 'disabled="disabled"'}>
     <legend class="govuk-fieldset__legend govuk-fieldset__legend--s">
       Publishing status
     </legend>
     <div class="govuk-radios govuk-radios--small" id="include-pages">
       <div class="govuk-radios__item">
         <input class="govuk-radios__input"
                type="radio" id="pages-all"
                name="pages"
           ${state.searchParams.pages === 'all' ? 'checked' : ''}/>
         <label for="pages-all" class="govuk-label govuk-radios__label">All</label>
       </div>
       <div class="govuk-radios__item">
         <input class="govuk-radios__input"
                type="radio" id="pages-withdrawn"
                name="pages"
           ${state.searchParams.pages === 'withdrawn' ? 'checked' : ''}/>
         <label for="pages-withdrawn" class="govuk-label govuk-radios__label">Withdrawn</label>
       </div>
       <div class="govuk-radios__item">
         <input class="govuk-radios__input"
                type="radio" id="pages-notWithdrawn"
                name="pages"
           ${state.searchParams.pages === 'notWithdrawn' ? 'checked' : ''}/>
         <label for="pages-notWithdrawn" class="govuk-label govuk-radios__label">
           Non-withdrawn
         </label>
       </div>
     </div>
   </fieldset>
 </div>
`;


export const viewSearchFilters = () => `
  ${viewKeywordsCombinator()}
  ${viewExclusionsInput()}
  ${viewCaseSensitiveSelector()}
  ${viewScopeSelector()}
  ${viewPublishingAppSelector()}
  ${viewPublishingOrgSelector()}
  ${viewTaxonSelector()}
  ${viewLocaleSelector()}
  ${viewPagesSelector()}
`;

export { viewSearchBox };
