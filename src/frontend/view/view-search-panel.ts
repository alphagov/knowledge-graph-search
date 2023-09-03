import { sanitiseOutput } from '../../common/utils/utils'
import { state } from '../state'
import { languageName } from '../../common/utils/lang'
import {
  Combinator,
  KeywordLocation,
  PublishingApplication,
  SearchType,
} from '../../common/types/search-api-types'

const viewAdvancedSearchPanel = () => `
      <form id="search-form" class="search-panel govuk-form">
        <div class="search-mode-panel">
          <h1 class="govuk-heading-xl">Advanced search</h1>
          ${viewKeywordsInput()}
          ${viewKeywordsCombinator()}
          ${viewExclusionsInput()}
          ${viewCaseSensitiveSelector()}
          ${viewScopeSelector()}
          ${viewLinkSearch()}
          ${viewPublishingOrgSelector()}
          ${viewPublishingAppSelector()}
          ${viewTaxonSelector()}
          ${viewLocaleSelector()}
          ${viewSearchButton()}
        </div>
      </form>
    `

const viewKeywordSearchPanel = () => `
      <form id="search-form" class="search-panel govuk-form">
        <div class="search-mode-panel">
          <a class="govuk-skip-link" href="#results-table">Skip to results</a>
          ${viewKeywordsInput()}
          <details class="govuk-details" data-module="govuk-details">
            <summary class="govuk-details__summary">
              <span class="govuk-details__summary-text">
                Search filters
              </span>
            </summary>
            <div class="govuk-details__text">
              ${viewCaseSensitiveSelector()}
              ${viewKeywordsCombinator()}
              ${viewExclusionsInput()}
              ${viewKeywordLocation()}
              ${viewPublishingOrganisation()}
              ${viewDocumentType()}
              ${viewPublishingAppSelector()}
              ${viewTaxonSelector()}
            </div>
          </details>
          ${viewSearchButton()}
        </div>
      </form>
    `

const viewTaxonSearchPanel = () => `
      <form id="search-form" class="search-panel govuk-form">
        <div class="search-mode-panel">
          <a class="govuk-skip-link" href="#results-table">Skip to results</a>
          ${viewTaxonSelector()}
          <details class="govuk-details" data-module="govuk-details">
            <summary class="govuk-details__summary">
              <span class="govuk-details__summary-text">
                Search filters
              </span>
            </summary>
            <div class="govuk-details__text">
              ${viewPublishingAppSelector()}
            </div>
          </details>
          ${viewSearchButton()}
        </div>
      </form>
    `

const viewLinkSearchPanel = () => `
      <form id="search-form" class="search-panel govuk-form">
        <div class="search-mode-panel">
          <a class="govuk-skip-link" href="#results-table">Skip to results</a>
          ${viewLinkSearch()}
          <details class="govuk-details" data-module="govuk-details">
            <summary class="govuk-details__summary">
              <span class="govuk-details__summary-text">
                Search filters
              </span>
            </summary>
            <div class="govuk-details__text">
              ${viewPublishingAppSelector()}
            </div>
          </details>
          ${viewSearchButton()}
        </div>
      </form>
    `

const viewLanguageSearchPanel = () => `
      <form id="search-form" class="search-panel govuk-form">
        <div class="search-mode-panel">
          <a class="govuk-skip-link" href="#results-table">Skip to results</a>
          ${viewLocaleSelector()}
          <details class="govuk-details" data-module="govuk-details">
            <summary class="govuk-details__summary">
              <span class="govuk-details__summary-text">
                Search filters
              </span>
            </summary>
            <div class="govuk-details__text">
              ${viewPublishingAppSelector()}
            </div>
          </details>
          ${viewSearchButton()}
        </div>
      </form>
    `

const viewOrganisationSearchPanel = () => `
      <form id="search-form" class="search-panel govuk-form">
        <div class="search-mode-panel">
          <a class="govuk-skip-link" href="#results-table">Skip to results</a>
          ${viewPublishingOrgSelector()}
          <details class="govuk-details" data-module="govuk-details">
            <summary class="govuk-details__summary">
              <span class="govuk-details__summary-text">
                Search filters
              </span>
            </summary>
            <div class="govuk-details__text">
              ${viewPublishingAppSelector()}
            </div>
          </details>
          ${viewSearchButton()}
        </div>
      </form>
    `

const viewSearchPanel = () => {
  const { searchType } = state.searchParams
  const mapping = {
    [SearchType.Advanced]: viewAdvancedSearchPanel,
    [SearchType.Results]: viewAdvancedSearchPanel,
    [SearchType.Keyword]: viewKeywordSearchPanel,
    [SearchType.Link]: viewLinkSearchPanel,
    [SearchType.Taxon]: viewTaxonSearchPanel,
    [SearchType.Language]: viewLanguageSearchPanel,
    [SearchType.Organisation]: viewOrganisationSearchPanel,
  }

  if (!(searchType in mapping)) {
    console.error('viewSearchPanel: unknown value', searchType)
    return null
  }

  return searchType in mapping ? mapping[searchType]() : console.error()
}

const viewKeywordLocation = () => `
<div class="govuk-form-group">
  <label class="govuk-label govuk-label--s" for="search-filters-keyword-location">
    Keyword location
  </label>
  <select class="govuk-select" id="search-filters-keyword-location" name="search-filters-keyword-location" style="width: 100%;">
    <option value="${KeywordLocation.All}" ${
  state.searchParams.keywordLocation === KeywordLocation.All ? 'selected' : ''
}>All keyword locations</option>
    <option value="${KeywordLocation.Title}" ${
  state.searchParams.keywordLocation === KeywordLocation.Title ? 'selected' : ''
}>Title</option>
    <option value="${KeywordLocation.BodyContent}" ${
  state.searchParams.keywordLocation === KeywordLocation.BodyContent
    ? 'selected'
    : ''
}>Body content</option>
    <option value="${KeywordLocation.Description}" ${
  state.searchParams.keywordLocation === KeywordLocation.Description
    ? 'selected'
    : ''
}>Description</option>
  </select>
</div>
`

const viewPublishingOrganisation = () => {
  const html = [
    `
    <div class="govuk-form-group" data-state="${state.waiting && 'disabled'}">
      <label class="govuk-label govuk-label--s" for="search-filters-publishing-organisation">
        Publishing organisations
      </label>
      <select ${
        state.waiting && 'disabled="disabled"'
      } id="search-filters-publishing-organisation" class="autocomplete__input autocomplete__input--default" name="search-filters-publishing-organisation">
      <option value="" ></option>
  `,
  ]

  html.push(`
      ${html.push(
        ...state.organisations
          .sort()
          .map(
            (organisation) =>
              `<option value="${organisation}" ${
                state.searchParams.selectedPublishingOrganisation ===
                organisation
                  ? 'selected'
                  : ''
              }>${organisation}</option>`
          )
      )}
        </select>
    </div>`)
  return html.join('')
}

const viewDocumentType = () => {
  const html = [
    `
    <div class="govuk-form-group" data-state="${state.waiting && 'disabled'}">
      <label class="govuk-label govuk-label--s" for="search-filters-document-type">
        Document type
      </label>
      <select ${
        state.waiting && 'disabled="disabled"'
      } id="search-filters-document-type" class="autocomplete__input autocomplete__input--default" name="documentType">
      <option value="" ></option>
  `,
  ]

  html.push(`
      ${html.push(
        ...state.documentTypes
          .sort()
          .map(
            (documentType) =>
              `<option value="${documentType}" ${
                state.searchParams.selectedDocumentType == documentType
                  ? 'selected'
                  : ''
              }>${(
                documentType.charAt(0).toUpperCase() + documentType.slice(1)
              ).replace(/_/g, ' ')}</option>`
          )
      )}
        </select>
    </div>`)
  return html.join('')
}

const viewScopeSelector = (): string => {
  return `
      <div class="govuk-form-group">
        <label class="govuk-label" for="search-keyword-location">
          Keyword location
        </label>
        <select class="govuk-select" id="search-keyword-location" name="search-keyword-location">
          <option value="${KeywordLocation.All}" ${
    state.searchParams.keywordLocation === KeywordLocation.All ? 'selected' : ''
  }>All keyword locations</option>
          <option value="${KeywordLocation.Title}" ${
    state.searchParams.keywordLocation === KeywordLocation.Title
      ? 'selected'
      : ''
  }>Title</option>
          <option value="${KeywordLocation.BodyContent}" ${
    state.searchParams.keywordLocation === KeywordLocation.BodyContent
      ? 'selected'
      : ''
  }>Body content</option>
          <option value="${KeywordLocation.Description}" ${
    state.searchParams.keywordLocation === KeywordLocation.Description
      ? 'selected'
      : ''
  }>Description</option>
        </select>
      </div>
  `
}

const viewTaxonSelector = () => `
    <div class="govuk-form-group" data-state="${state.waiting && 'disabled'}">
      <label class="govuk-label govuk-label--s" for="search-filters-taxon">
        Taxons
      </label>
      <select ${
        state.waiting && 'disabled="disabled"'
      } id="search-filters-taxon" class="autocomplete__input autocomplete__input--default" name="search-filters-taxon">
      <option value=""></option>
      ${state.taxons
        .sort()
        .map(
          (taxon) =>
            `<option value="${taxon}" ${
              state.searchParams.selectedTaxon === taxon ? 'selected' : ''
            }>${taxon}</option>`
        )
        .join('')}
        </select>
    </div>`

const viewLocaleSelector = () => {
  const html = [
    `
    <div class="govuk-body taxon-facet">
      <label class="govuk-label label--bold" for="locale">
        Search for languages
      </label>
      <div class="govuk-hint">
        Type the first letters of a language or select from the dropdown
      </div>
      <datalist id="localeList">
  `,
  ]
  html.push(
    ...state.locales.map(
      (code) =>
        `<option data-value="${code}" ${
          state.searchParams.selectedLocale === code ? 'selected' : ''
        }>${languageName(code)}</option>`
    )
  )
  html.push(`
      </datalist>
      <input type="text"
         ${state.waiting && 'disabled="disabled"'}
         value="${state.searchParams.selectedLocale}"
         class="govuk-input"
         list="localeList"
         id="locale" name="locale"
         autocomplete="off" />
    </div>`)
  return html.join('')
}

const viewSearchButton = () => `
  <p class="govuk-body">
    <button
      type="submit"
      class="govuk-button ${state.waiting ? 'govuk-button--disabled' : ''}"
      ${state.waiting ? 'disabled="disabled"' : ''}
      id="search">
      ${
        state.waiting
          ? 'Searching <svg width="20" height="20" class="loader" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><style>.spinner_z9k8{transform-origin:center;animation:spinner_StKS .75s infinite linear}@keyframes spinner_StKS{100%{transform:rotate(360deg)}}</style><path d="M12,1A11,11,0,1,0,23,12,11,11,0,0,0,12,1Zm0,19a8,8,0,1,1,8-8A8,8,0,0,1,12,20Z" opacity=".25"/><path d="M12,4a8,8,0,0,1,7.89,6.7A1.53,1.53,0,0,0,21.38,12h0a1.5,1.5,0,0,0,1.48-1.75,11,11,0,0,0-21.72,0A1.5,1.5,0,0,0,2.62,12h0a1.53,1.53,0,0,0,1.49-1.3A8,8,0,0,1,12,4Z" class="spinner_z9k8"/></svg>'
          : 'Search'
      }
    </button>
  </p>
`

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
`

const viewCaseSensitiveSelector = () => `
<div class="govuk-form-group">
  <div class="govuk-checkboxes govuk-checkboxes--small">
    <div class="govuk-checkboxes__item">
      <input
          class="govuk-checkboxes__input"
          ${state.waiting && 'disabled="disabled"'}
          type="checkbox"
          id="search-filters-case-sensitive"
          name="search-filters-case-sensitive"
          ${state.searchParams.caseSensitive ? 'checked' : ''}
      />
      <label for="search-filters-case-sensitive" class="govuk-label govuk-checkboxes__label">Enable case sensitive</label>
    </div>
  </div>
</div>
`

const viewKeywordsCombinator = () => `
<div class="govuk-form-group">
  <fieldset class="govuk-fieldset">
    <legend class="govuk-fieldset__legend govuk-fieldset__legend--s">
        Search for
    </legend>
    <div class="govuk-radios govuk-radios--small" data-module="govuk-radios">
      <div class="govuk-radios__item">
        <input class="govuk-radios__input" id="search-filters-combinator-1" name="search-filters-combinator" type="radio" value="${
          Combinator.All
        }" ${state.searchParams.combinator === Combinator.All ? 'checked' : ''}>
        <label class="govuk-label govuk-radios__label" for="search-filters-combinator">
          All keywords
        </label>
        <div class="govuk-hint govuk-radios__hint">
            Narrows search eg, dog and cat
          </div>
      </div>
      <div class="govuk-radios__item">
        <input class="govuk-radios__input" id="search-filters-combinator-2" name="search-filters-combinator" type="radio" value="${
          Combinator.Any
        }" ${state.searchParams.combinator === Combinator.Any ? 'checked' : ''}>
        <label class="govuk-label govuk-radios__label" for="search-filters-combinator">
          Any keyword
        </label>
        <div class="govuk-hint govuk-radios__hint">
            Expands search eg, dog or cat
          </div>
      </div>
    </div>
  </fieldset>
</div>
`

const viewPublishingOrgSelector = () => `
  <div class="govuk-body">
    <div class="taxon-facet">
      <label class="govuk-label label--bold" for="publishing-organisation">
        Search for publishing organisations
      </label>
      <div class="govuk-hint">
        Type the first letters of an organisation or select from the dropdown
      </div>
      <datalist id="orgList">
        ${state.organisations.map(
          (organisation) => `<option>${organisation}</option>`
        )}
      </datalist>
      <div>
      <input
        ${state.waiting && 'disabled="disabled"'}
        style="display: inline-block"
        list="orgList"
        value="${state.searchParams.selectedPublishingOrganisation}"
        class="govuk-input"
        id="organisation"
        autocomplete="off" />
      </div>
    </div>
  </div>
`

const viewPublishingAppSelector = () => `
      <div class="govuk-form-group" data-state="${state.waiting && 'disabled'}">
        <label class="govuk-label govuk-label--s" for="search-filters-publishing-application">
          Publishing applications
        </label>
        <select ${
          state.waiting && 'disabled="disabled"'
        } id="search-filters-publishing-application" class="govuk-select" name="search-filters-publishing-application" style="width: 100%;">
          <option value="${PublishingApplication.Any}" ${
  state.searchParams.publishingApplication === PublishingApplication.Any
    ? 'selected'
    : ''
}>All publishing applications</option>
          <option value="${PublishingApplication.Publisher}" ${
  state.searchParams.publishingApplication === PublishingApplication.Publisher
    ? 'selected'
    : ''
}>Publisher (mainstream)</option>
          <option value="${PublishingApplication.Whitehall}" ${
  state.searchParams.publishingApplication === PublishingApplication.Whitehall
    ? 'selected'
    : ''
}>Whitehall (specialist)</option>
        </select>
    </div>`

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
      value='${sanitiseOutput(state.searchParams.selectedWords)}'
    />
  </div>
`

const viewExclusionsInput = () => `
<div class="govuk-form-group">
  <label class="govuk-label govuk-label--s" for="search-filters-excluded-keywords">
    Excluding these words
  </label>
  <input class="govuk-input" id="search-filters-excluded-keywords" name="search-filters-excluded-keywords" type="text" value="${state.searchParams.excludedWords}">
</div>
`

export { viewSearchPanel }
