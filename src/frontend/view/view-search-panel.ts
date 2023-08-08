import { sanitiseOutput } from '../../common/utils/utils'
import { state, searchState } from '../state'
import { languageName } from '../../common/utils/lang'
import { SearchType } from '../../common/types/search-api-types'
import { USER_ERRORS } from '../enums/constants'

const viewSearchPanel = () => {
  const result = []
  switch (state.searchParams.searchType) {
    case SearchType.Advanced:
    case SearchType.Results:
      result.push(`
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
    `)
      break
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
    `)
      break
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
    `)
      break
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
    `)
      break
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
    `)
      break
    case SearchType.Organisation:
      result.push(`
      <form id="search-form" class="search-panel govuk-form">
        <div class="search-mode-panel">
          <a class="govuk-skip-link" href="#results-table">Skip to results</a>
          ${viewPublishingOrgSelector()}
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
    `)
      break
    default:
      console.log(
        'viewSearchPanel: unknown value',
        state.searchParams.searchType
      )
  }
  return result.join('')
}

const viewInlineError = (id: string, message: string): string => `
  <p id="${id}" class="govuk-error-message">
    <span class="govuk-visually-hidden">Error:</span> ${message}
  </p>
`

const viewScopeSelector = (): string => {
  const errors = searchState()?.errors
  const err = errors && errors.includes(USER_ERRORS.MISSING_WHERE_TO_SEARCH)
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
      ${
        err
          ? viewInlineError('scope-error', 'Please choose at least one option')
          : ''
      }
      <div class="govuk-checkboxes" id="search-locations">
        <div class="govuk-checkboxes__item">
          <input
              class="govuk-checkboxes__input"
              type="checkbox" id="search-title"
              name="search-title"
              ${state.searchParams.whereToSearch.title ? 'checked' : ''}/>
          <label for="search-title" class="govuk-label govuk-checkboxes__label">title</label>
        </div>
        <div class="govuk-checkboxes__item">
          <input
              class="govuk-checkboxes__input"
              type="checkbox"
              id="search-text"
              name="search-text"
            ${state.searchParams.whereToSearch.text ? 'checked' : ''}/>
          <label for="search-text" class="govuk-label govuk-checkboxes__label">
            body content and description
          </label>
        </div>
      </div>
    </fieldset>
  </div>
  `
}

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
        ${state.taxons.map((taxon) => `<option>${taxon}</option>`)}
      </datalist>
      <div>
      <input
        ${state.waiting && 'disabled="disabled"'}
        style="display: inline-block"
        list="taxonList"
        value="${state.searchParams.selectedTaxon}"
        class="govuk-input"
        id="taxon"
        autocomplete="off" />
      </div>
    </div>
  </div>
`

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
  <div class="govuk-body">
    <div class="govuk-checkboxes">
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
`

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
            ${state.searchParams.combinator === 'any' ? 'checked' : ''}/>
          <label for="combinator-any" class="govuk-label govuk-radios__label">
            any keyword
          </label>
        </div>
        <div class="govuk-radios__item">
          <input class="govuk-radios__input"
                 type="radio" id="combinator-all"
                 name="combinator"
            ${state.searchParams.combinator === 'all' ? 'checked' : ''}/>
          <label for="combinator-all" class="govuk-label govuk-radios__label">
            all keywords
          </label>
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
        value="${state.searchParams.selectedOrganisation}"
        class="govuk-input"
        id="organisation"
        autocomplete="off" />
      </div>
    </div>
  </div>
`

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
                 type="radio" id="area-publisher"
                 name="area"
            ${
              state.searchParams.areaToSearch === 'publisher' ? 'checked' : ''
            }/>
          <label for="area-publisher" class="govuk-label govuk-radios__label">
            Publisher
          </label>
        </div>
        <div class="govuk-radios__item">
          <input class="govuk-radios__input"
                 type="radio" id="area-whitehall"
                 name="area"
            ${
              state.searchParams.areaToSearch === 'whitehall' ? 'checked' : ''
            }/>
          <label for="area-whitehall" class="govuk-label govuk-radios__label">Whitehall</label>
        </div>
        <div class="govuk-radios__item">
          <input class="govuk-radios__input"
                 type="radio" id="area-any"
                 name="area"
            ${state.searchParams.areaToSearch === 'any' ? 'checked' : ''}/>
          <label for="area-any" class="govuk-label govuk-radios__label">All publishing applications</label>
        </div>
      </div>
    </fieldset>
  </div>
`

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
        value='${sanitiseOutput(state.searchParams.excludedWords).replace(
          '"',
          '&quot;'
        )}'/>
  </div>
`

export { viewSearchPanel }
