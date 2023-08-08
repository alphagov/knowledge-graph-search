import { sanitiseOutput } from '../utils';
import { state, searchState } from '../state';
import { languageName } from '../lang';
import { SearchType, WhereToSearch, SearchArea, Pages } from '../search-api-types';



const viewSearchBox = (initialSearch: boolean) => {
  return `<form id="search-form" class="govuk-form">
    <div class="search-mode-panel">
      <h1 class="govuk-heading-m govuk-visually-hidden">Search GOV.UK Content</h1>
      ${viewKeywordsInput(initialSearch)}
    </div>
  </form>`;
};


export const viewSearchButton = () =>  `
  <p class="govuk-body">
    <button
      type="submit"
      class="govuk-button ${state.waiting ? 'govuk-button--disabled' : ''}"
      ${state.waiting ? 'disabled="disabled"' : ''}
      id="search">
      ${state.waiting ? 'Applying filters <img src="assets/images/loader.gif" height="20px" alt="loader"/>' : 'Apply filters'}
    </button>
  </p>
` ;

const viewInlineError = (id: string, message: string): string => `
  <p id="${id}" class="govuk-error-message">
    <span class="govuk-visually-hidden">Error:</span> ${message}
  </p>
`;

const viewScopeSelector = () => `<div class="govuk-form-group" data-state="${state.waiting && 'disabled'}">
  <label class="govuk-label govuk-label--s" for="whereToSearch">
    Keyword location
  </label>
  <select ${state.waiting && 'disabled="disabled"'} id="whereToSearch" class="govuk-select" name="whereToSearch" style="width: 100%;">
    <option value="${WhereToSearch.All}" ${state.searchParams.whereToSearch == WhereToSearch.All ? 'selected' : ''}>All keyword locations</option>
    <option value="${WhereToSearch.Title}" ${state.searchParams.whereToSearch == WhereToSearch.Title ? 'selected' : ''}>Title</option>
    <option value="${WhereToSearch.Description}" ${state.searchParams.whereToSearch == WhereToSearch.Description ? 'selected' : ''}>Description</option>
    <option value="${WhereToSearch.Text}" ${state.searchParams.whereToSearch === WhereToSearch.Text  ? 'selected' : ''}>Body content</option>
  </select>
</div>`

const viewTaxonSelector = () => {

const html = [`
  <div class="govuk-form-group" data-state="${state.waiting && 'disabled'}">
    <label class="govuk-label govuk-label--s" for="taxon">
      Taxons
    </label>
    <select ${state.waiting && 'disabled="disabled"'} id="taxon" class="autocomplete__input autocomplete__input--default" name="taxon">
    <option value=""></option>
`];

html.push(`
    ${html.push(...state.taxons.sort().map(taxon => `<option value="${taxon}" ${state.searchParams.selectedTaxon == taxon ? 'selected' : ''}>${taxon}</option>`))}
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
        name="link-search"
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
            name="case-sensitive"
            ${state.searchParams.caseSensitive ? 'checked' : ''}
        />
        <label for="case-sensitive" class="govuk-label govuk-checkboxes__label">case-sensitive search</label>
      </div>
    </div>
  </div>
`;


const viewKeywordsCombinator = () => `<div class="govuk-form-group">
    <fieldset
        class="govuk-fieldset"
        id="combinator-wrapper"
        ${state.waiting && 'disabled="disabled"'}>
      <legend class="govuk-fieldset__legend govuk-fieldset__legend--s">
        Search for
      </legend>
      <div class="govuk-radios govuk-radios--small" id="combinators">

        <div class="govuk-radios__item">
          <input class="govuk-radios__input"
                 type="radio" id="combinator-all"
                 name="combinator"
            ${state.searchParams.combinator === 'all'  ? 'checked' : ''}/>
          <label for="combinator" class="govuk-label govuk-radios__label">
            All keywords
          </label>
          <div class="govuk-hint govuk-radios__hint">
            Narrows search eg, dog and cat
          </div>
        </div>

        <div class="govuk-radios__item">
          <input class="govuk-radios__input"
                 type="radio" id="combinator-any"
                 name="combinator"
            ${state.searchParams.combinator === 'any' ? 'checked' : ''}/>
          <label for="combinator" class="govuk-label govuk-radios__label">
            Any keyword
          </label>
          <div class="govuk-hint govuk-radios__hint">
            Expands search eg, dog or cat
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
    <option value="" ></option>
`];

html.push(`
    ${html.push(...state.organisations.sort().map(organisation => `<option value="${organisation}" ${state.searchParams.selectedOrganisation == organisation ? 'selected' : ''}>${organisation}</option>`))}
      </select>
  </div>`);
return html.join('');

};

const viewDocumentTypeSelector = () => {

const html = [`
  <div class="govuk-form-group" data-state="${state.waiting && 'disabled'}">
    <label class="govuk-label govuk-label--s" for="documentType">
      Document type
    </label>
    <select ${state.waiting && 'disabled="disabled"'} id="documentType" class="autocomplete__input autocomplete__input--default" name="documentType">
    <option value="" ></option>
`];

html.push(`
    ${html.push(...state.documentTypes.sort().map(documentType => `<option value="${documentType}" ${state.searchParams.selectedDocumentType == documentType ? 'selected' : ''}>${(documentType.charAt(0).toUpperCase() + documentType.slice(1)).replace(/_/g, ' ')}</option>`))}
      </select>
  </div>`);
return html.join('');

};


 const viewPublishingAppSelector = () => {
     const html = [];
     html.push(`
         <div class="govuk-form-group" data-state="${state.waiting && 'disabled'}">
           <label class="govuk-label govuk-label--s" for="area">
             Publishing applications
           </label>
           <select ${state.waiting && 'disabled="disabled"'} id="searchArea" class="govuk-select" name="area" style="width: 100%;">
             <option value="${SearchArea.Any}" ${state.searchParams.areaToSearch == SearchArea.Any ? 'selected' : ''}>All publishing applications</option>
             <option value="${SearchArea.Publisher}" ${state.searchParams.areaToSearch == SearchArea.Publisher ? 'selected' : ''}>Publisher (mainstream)</option>
             <option value="${SearchArea.Whitehall}" ${state.searchParams.areaToSearch == SearchArea.Whitehall ? 'selected' : ''}>Whitehall (specialist)</option>
           </select>
       </div>`);
   return html.join('');
 }
/*
 const viewPublishingAppSelector = () => {

 const html = [`
   <div class="govuk-form-group" data-state="${state.waiting && 'disabled'}">
     <label class="govuk-label govuk-label--s" for="publishing-applications">
       Publishing applications
     </label>
     <select ${state.waiting && 'disabled="disabled"'} id="searchArea" class="autocomplete__input autocomplete__input--default" name="publishing-applications">
     <option value="" ></option>
 `];

 html.push(`
     ${html.push(...state.publishingApps.sort().map(app => `<option value="${app}" ${state.searchParams.areaToSearch == app ? 'selected' : ''}>${app[0].toUpperCase() + app.slice(1).toLowerCase().replace(/_|-/g, ' ')}</option>`))}
       </select>
   </div>`);
 return html.join('');

 };
*/

const viewKeywordsInput = (initialSearch: boolean) => `
<div class="gem-c-search govuk-!-display-none-print  gem-c-search--on-white" data-module="gem-toggle-input-class-on-focus" data-gem-toggle-input-class-on-focus-module-started="true" style="margin-bottom: 0">
<div class="govuk-input__wrapper">
<div class="govuk-form-group">
  <label class="govuk-label govuk-visually-hidden" for="searchType">
    Search by
  </label>
  <select class="govuk-select" id="searchType" name="searchType" ${state.waiting && 'disabled="disabled"'}>
    <option value="keyword" ${state.searchParams.searchType === 'keyword' ? 'selected' : ''}>Search for keywords</option>
    <option value="link" ${state.searchParams.searchType === 'link' ? 'selected' : ''}>Search for links</option>
  </select>
</div>
  <input
  ${state.waiting && 'disabled="disabled"'}
  enterkeyhint="search" class="govuk-input" style="margin-left: -2px;${initialSearch ? '' : 'margin-right: 36px;'}" id="${state.searchParams.searchType === 'keyword' ? 'keyword' : 'link-search'}" name="search" title="Search" type="search" aria-describedby="search-name-hint"
  value='${state.searchParams.searchType === 'keyword' ? sanitiseOutput(state.searchParams.selectedWords) : sanitiseOutput(state.searchParams.linkSearchUrl)}' data-form-type="">

  ${ initialSearch ? '' : `
  <div class="gem-c-search__item gem-c-search__submit-wrapper">
    <button
    id="search"
    class="gem-c-search__submit ${state.waiting ? 'govuk-button--disabled' : ''}"
    ${state.waiting ? 'disabled="disabled"' : ''}
    type="submit"
    ${initialSearch ? '' : 'style="margin-left: -36px;"'}
    data-form-type="">
      <svg class="gem-c-search__icon" width="27" height="27" viewBox="0 0 27 27" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
        <circle cx="12.0161" cy="11.0161" r="8.51613" stroke="currentColor" stroke-width="3"></circle>
        <line x1="17.8668" y1="17.3587" x2="26.4475" y2="25.9393" stroke="currentColor" stroke-width="3"></line>
      </svg>
    </button>
   </div>`}
  </div>
</div>

`;


const viewExclusionsInput = () => `
  <div class="govuk-form-group">
    <label for="excluded-keyword" class="govuk-label govuk-label--s">
      Exclude keywords
    </label>
    <input class="govuk-input"
        ${state.waiting && 'disabled="disabled"'}
        id="excluded-keyword"
        name="excluded-keyword"
        value='${sanitiseOutput(state.searchParams.excludedWords).replace('"', '&quot;')}'/>
  </div>
`;


const viewPagesSelector = () => {
    const html = [];
    html.push(`
        <div class="govuk-form-group" data-state="${state.waiting && 'disabled'}">
          <label class="govuk-label govuk-label--s" for="pages">
            Publishing status
          </label>
          <select ${state.waiting && 'disabled="disabled"'} id="pages" class="govuk-select" name="pages" style="width: 100%;">
            <option value="${Pages.All}" ${state.searchParams.pages == Pages.All ? 'selected' : ''}>All statuses</option>
            <option value="${Pages.Withdrawn}" ${state.searchParams.pages == Pages.Withdrawn ? 'selected' : ''}>Withdrawn</option>
            <option value="${Pages.NotWithdrawn}" ${state.searchParams.pages == Pages.NotWithdrawn ? 'selected' : ''}>Non-withdrawn</option>
          </select>
      </div>`);
  return html.join('');
}

export const viewSearchFilters = () => state.searchParams.searchType === 'keyword' ? `
<div class="sidebar-left-column">
  ${viewCaseSensitiveSelector()}
  ${viewKeywordsCombinator()}
  ${viewExclusionsInput()}
  ${viewScopeSelector()}
  ${viewPublishingAppSelector()}
</div>
<div class="sidebar-right-column">
  ${viewPublishingOrgSelector()}
  ${viewDocumentTypeSelector()}
  ${viewTaxonSelector()}
  ${viewLocaleSelector()}
  ${viewPagesSelector()}
</div>
  `:
 `<div class="sidebar-left-column-links">
  ${viewPublishingAppSelector()}
  ${viewPublishingOrgSelector()}
  ${viewDocumentTypeSelector()}
  </div>
  <div class="sidebar-right-column-links">
  ${viewTaxonSelector()}
  ${viewLocaleSelector()}
  ${viewPagesSelector()}
  </div>
  `;

export { viewSearchBox };
