import { sanitiseOutput } from '../../common/utils/utils'
import { state } from '../state'
import { languageName } from '../../common/utils/lang'
import { formatPublishingApp } from '../utils/formatters'
import {
  Combinator,
  KeywordLocation,
  PublishingStatus,
  PoliticalStatus,
  SearchType,
} from '../../common/types/search-api-types'

const viewSearchPanel = () => {
  const { searchType } = state.searchParams
  const mapping = {
    [SearchType.Keyword]: viewKeywordSearchPanel,
    [SearchType.Link]: viewLinkSearchPanel,
    [SearchType.PhoneNumber]: viewPhoneNumberSearchPanel,
    [SearchType.Organisation]: viewOrganisationSearchPanel,
    [SearchType.Taxon]: viewTaxonSearchPanel,
    [SearchType.Language]: viewLanguageSearchPanel,
    [SearchType.Advanced]: viewAdvancedSearchPanel,
    [SearchType.Results]: viewAdvancedSearchPanel,
    [SearchType.Person]: viewPersonSearchPanel,
  }

  if (!(searchType in mapping)) {
    console.error('viewSearchPanel: unknown value', searchType)
    return null
  }

  return mapping[searchType]()
}

const viewKeywordSearchPanel = () => `
      <form id="search-form" class="search-panel govuk-form">
        <div class="search-mode-panel">
          ${viewKeywordsInput()}
          ${
            state.searchResults
              ? ''
              : `<details class="govuk-details" data-module="govuk-details">
            <summary class="govuk-details__summary">
              <span class="govuk-details__summary-text">
                Search filters
              </span>
            </summary>
            <div class="govuk-details__text">
              <div class="search-filters-container">
                <div class="search-filters-left-col keyword-search">
                  ${viewCaseSensitiveSelector()}
                  ${viewKeywordsCombinator(true)}
                  ${viewExclusionsInput()}
                  ${viewKeywordLocation()}
                  ${viewPublishingOrganisation()}
                </div>
                <div class="search-filters-right-col keyword-search">
                  ${viewDocumentType()}
                  ${viewPublishingAppSelector()}
                  ${viewTaxonSelector()}
                  ${viewPublishingStatusSelector()}
                  ${viewLanguageSelector()}
                  ${viewPoliticalStatusSelector()}
                  ${viewGovernmentSelector()}
                </div>
              </div>
            </div>
          </details>`
          }
          ${viewSearchButton()}
        </div>
      </form>
    `

export const viewAdvancedSearchPanel = (onTheSide = true) => {
  const title = onTheSide
    ? `<h2 class="govuk-heading-m">Advanced search</h2>`
    : `<h1 class="govuk-heading-xl">Advanced search</h1>`
  const inside = `
      <form id="search-form" class="search-panel govuk-form">
        <div class="search-mode-panel ${onTheSide ? '' : 'advanced-panel'}">
          ${title}
          ${viewKeywordsInput()}
          ${viewCaseSensitiveSelector()}
          ${viewKeywordsCombinator()}
          ${viewExclusionsInput()}
          ${viewLinkSearchInput()}
          ${viewPhoneNumberSearchInput()}
          ${viewKeywordLocation()}
          ${viewPublishingOrganisation()}
          ${viewDocumentType()}
          ${viewPublishingAppSelector()}
          ${viewTaxonSelector()}
          ${viewPublishingStatusSelector()}
          ${viewLanguageSelector()}
          ${viewPersonSelector()}
          ${viewPoliticalStatusSelector()}
          ${viewGovernmentSelector()}
          ${viewSearchButton()}
        </div>
      </form>
    `
  const outsideWrap = (_inside) =>
    onTheSide ? `<div class="side-filters">${_inside}</div>` : _inside

  return outsideWrap(inside)
}

const viewLinkSearchPanel = () => `
    <form id="search-form" class="search-panel govuk-form">
      <div class="search-mode-panel">
        ${viewMainLinkSearch()}
        ${
          state.searchResults
            ? ''
            : `<details class="govuk-details" data-module="govuk-details">
          <summary class="govuk-details__summary">
          <span class="govuk-details__summary-text">
          Search filters
          </span>
          </summary>
          <div class="govuk-details__text">
          <div class="search-filters-container">
          <div class="search-filters-left-col links-search">
          ${viewLinksExactMatchSelector()}
          ${viewPublishingOrganisation()}
          ${viewPublishingAppSelector()}
          ${viewDocumentType()}
              </div>
              <div class="search-filters-right-col links-search">
                ${viewTaxonSelector()}
                ${viewPublishingStatusSelector()}
                ${viewLanguageSelector()}
                ${viewPoliticalStatusSelector()}
                ${viewGovernmentSelector()}
              </div>
            </div>
          </div>
        </details>`
        }
        ${viewSearchButton()}
      </div>
    </form>
  `

const viewPhoneNumberSearchPanel = () => `
    <form id="search-form" class="search-panel govuk-form">
      <div class="search-mode-panel">
        ${viewMainPhoneNumberSearch()}
        ${
          state.searchResults
            ? ''
            : `<details class="govuk-details" data-module="govuk-details">
          <summary class="govuk-details__summary">
            <span class="govuk-details__summary-text">
              Search filters
            </span>
          </summary>
          <div class="govuk-details__text">
            <div class="search-filters-container">
              <div class="search-filters-left-col links-search">
              ${viewPublishingOrganisation()}
              ${viewPublishingAppSelector()}
              ${viewDocumentType()}
              </div>
              <div class="search-filters-right-col links-search">
                ${viewTaxonSelector()}
                ${viewPublishingStatusSelector()}
                ${viewLanguageSelector()}
                ${viewPoliticalStatusSelector()}
                ${viewGovernmentSelector()}
              </div>
            </div>
          </div>
        </details>`
        }
        ${viewSearchButton()}
      </div>
    </form>
  `

const viewTaxonSearchPanel = () => `
      <form id="search-form" class="search-panel govuk-form">
        <div class="search-mode-panel">
          ${viewTaxonSelector()}
          ${
            state.searchResults
              ? ''
              : `<details class="govuk-details" data-module="govuk-details">
            <summary class="govuk-details__summary">
              <span class="govuk-details__summary-text">
                Search filters
              </span>
            </summary>
            <div class="govuk-details__text">
              <div class="search-filters-container">
                <div class="search-filters-left-col taxon-search">
                  ${viewPublishingOrganisation()}
                  ${viewPublishingStatusSelector()}
                  ${viewLanguageSelector()}
                </div>
                <div class="search-filters-right-col taxon-search">
                  ${viewDocumentType()}
                  ${viewPublishingAppSelector()}
                  ${viewPoliticalStatusSelector()}
                  ${viewGovernmentSelector()}
                </div>
              </div>
            </div>
          </details>`
          }
          ${viewSearchButton()}
        </div>
      </form>
    `

const viewPersonSearchPanel = () => `
      <form id="search-form" class="search-panel govuk-form">
        <div class="search-mode-panel">
          ${viewPersonSelector()}
          ${
            state.searchResults
              ? ''
              : `<details class="govuk-details" data-module="govuk-details">
            <summary class="govuk-details__summary">
              <span class="govuk-details__summary-text">
                Search filters
              </span>
            </summary>
            <div class="govuk-details__text">
              <div class="search-filters-container">
                <div class="search-filters-left-col taxon-search">
                  ${viewPublishingOrganisation()}
                  ${viewPublishingStatusSelector()}
                  ${viewLanguageSelector()}
                </div>
                <div class="search-filters-right-col taxon-search">
                  ${viewDocumentType()}
                  ${viewPublishingAppSelector()}
                  ${viewPoliticalStatusSelector()}
                  ${viewGovernmentSelector()}
                </div>
              </div>
            </div>
          </details>`
          }
          ${viewSearchButton()}
        </div>
      </form>
    `

const viewLanguageSearchPanel = () => `
      <form id="search-form" class="search-panel govuk-form">
        <div class="search-mode-panel">
          ${viewLanguageSelector()}
          ${
            state.searchResults
              ? ''
              : `<details class="govuk-details" data-module="govuk-details">
            <summary class="govuk-details__summary">
              <span class="govuk-details__summary-text">
                Search filters
              </span>
            </summary>
            <div class="govuk-details__text">
              <div class="search-filters-container">
                <div class="search-filters-left-col language-search">
                  ${viewPublishingOrganisation()}
                  ${viewPublishingAppSelector()}
                  ${viewDocumentType()}
                </div>
                <div class="search-filters-right-col language-search">
                  ${viewTaxonSelector()}
                  ${viewPublishingStatusSelector()}
                  ${viewPoliticalStatusSelector()}
                  ${viewGovernmentSelector()}
                </div>
              </div>
            </div>
          </details>`
          }
          ${viewSearchButton()}
        </div>
      </form>
    `

const viewOrganisationSearchPanel = () => `
      <form id="search-form" class="search-panel govuk-form">
        <div class="search-mode-panel">
          ${viewPublishingOrgSelector()}
          ${
            state.searchResults
              ? ''
              : `<details class="govuk-details" data-module="govuk-details">
            <summary class="govuk-details__summary">
              <span class="govuk-details__summary-text">
                Search filters
              </span>
            </summary>
            <div class="govuk-details__text">
              <div class="search-filters-container">
                <div class="search-filters-left-col organisation-search">
                  ${viewPublishingAppSelector()}
                  ${viewPublishingStatusSelector()}
                  ${viewDocumentType()}
                </div>
                <div class="search-filters-right-col organisation-search">
                  ${viewTaxonSelector()}
                  ${viewLanguageSelector()}
                  ${viewPoliticalStatusSelector()}
                  ${viewGovernmentSelector()}
                </div>
              </div>
            </div>
          </details>`
          }
          ${viewSearchButton()}
        </div>
      </form>
    `

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

const viewPublishingOrgSelector = () => {
  const options = state.organisations
    .sort()
    .map(
      (organisation) =>
        `<option value="${organisation}" ${
          state.searchParams.publishingOrganisation === organisation
            ? 'selected'
            : ''
        }>${organisation}</option>`
    )
    .join('')
  return `
  <div class="govuk-form-group">
    <div class="taxon-facet">
      <label class="govuk-label govuk-label--s" for="search-filters-publishing-organisation">
        Search for publishing organisations
      </label>

      <select ${
        state.waiting && 'disabled="disabled"'
      } id="search-filters-publishing-organisation" class="autocomplete__input autocomplete__input--default" name="search-filters-publishing-organisation" style="display: inline-block">
        <option value="" ></option>
        ${options}
      </select>
    </div>
  </div>
`
}

const viewPublishingOrganisation = () => {
  const options = state.organisations
    .sort()
    .map(
      (organisation) =>
        `<option value="${organisation}" ${
          state.searchParams.publishingOrganisation === organisation
            ? 'selected'
            : ''
        }>${organisation}</option>`
    )
    .join('')

  const html = `
  <div class="govuk-form-group" data-state="${state.waiting && 'disabled'}">
    <label class="govuk-label govuk-label--s" for="search-filters-publishing-organisation">
      Publishing organisations
    </label>
    <select ${
      state.waiting && 'disabled="disabled"'
    } id="search-filters-publishing-organisation" class="autocomplete__input autocomplete__input--default" name="search-filters-publishing-organisation">
      <option value="" ></option>
      ${options}
    </select>
  </div>
  `

  return html
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
      } id="search-filters-document-type" class="autocomplete__input autocomplete__input--default" name="search-filters-document-type">
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
                state.searchParams.documentType === documentType
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

const viewGovernmentSelector = () => {
  const html = [
    `
    <div class="govuk-form-group" data-state="${state.waiting && 'disabled'}">
      <label class="govuk-label govuk-label--s" for="search-filters-government">
        Government
      </label>
      <select ${
        state.waiting && 'disabled="disabled"'
      } id="search-filters-government" class="autocomplete__input autocomplete__input--default" name="search-filters-government">
      <option value="" ></option>
  `,
  ]

  html.push(`
      ${html.push(
        ...state.governments
          .sort()
          .map(
            (government) =>
              `<option value="${government}" ${
                state.searchParams.government === government ? 'selected' : ''
              }>${government}</option>`
          )
      )}
        </select>
    </div>`)
  return html.join('')
}

const viewTaxonSelector = () => `
    <div class="govuk-form-group" data-state="${state.waiting && 'disabled'}">
      <label class="govuk-label govuk-label--s" for="search-filters-taxon">
        Search for topic tags
      </label>
      <select ${
        state.waiting && 'disabled="disabled"'
      } id="search-filters-taxon" class="autocomplete__input autocomplete__input--default" name="search-filters-taxon">
      <option value=""></option>
      ${[...new Set(state.taxons)]
        .sort()
        .map(
          (taxon) =>
            `<option value="${taxon}" ${
              state.searchParams.taxon === taxon ? 'selected' : ''
            }>${taxon}</option>`
        )
        .join('')}
        </select>
    </div>`

const viewPersonSelector = () => `
    <div class="govuk-form-group" data-state="${state.waiting && 'disabled'}">
      <label class="govuk-label govuk-label--s" for="search-filters-person">
       Search for pages associated with a person 
      </label>
      <select ${
        state.waiting && 'disabled="disabled"'
      } id="search-filters-person" class="autocomplete__input autocomplete__input--default" name="search-filters-person">
      <option value=""></option>
      ${[...new Set(state.persons)]
        .sort()
        .map(
          (person) =>
            `<option value="${person}" ${
              state.searchParams.associatedPerson === person ? 'selected' : ''
            }>${person}</option>`
        )
        .join('')}
        </select>
    </div>`

const viewPublishingStatusSelector = () => `
    <div class="govuk-form-group" data-state="${state.waiting && 'disabled'}">
      <label class="govuk-label govuk-label--s" for="search-filters-publishing-status">
        Publishing status
      </label>
      <select ${
        state.waiting && 'disabled="disabled"'
      } id="search-filters-publishing-status" class="govuk-select" name="search-filters-publishing-status" style="width: 100%;">
        <option value="${PublishingStatus.All}" ${
  state.searchParams.publishingStatus === PublishingStatus.All ? 'selected' : ''
}>All statuses</option>
        <option value="${PublishingStatus.Withdrawn}" ${
  state.searchParams.publishingStatus === PublishingStatus.Withdrawn
    ? 'selected'
    : ''
}>Withdrawn</option>
        <option value="${PublishingStatus.NotWithdrawn}" ${
  state.searchParams.publishingStatus === PublishingStatus.NotWithdrawn
    ? 'selected'
    : ''
}>Not withdrawn</option>
      </select>
  </div>`

const viewLanguageSelector = () => `
    <div class="govuk-form-group" data-state="${state.waiting && 'disabled'}">
      <label class="govuk-label govuk-label--s" for="search-filters-language">
        Search for languages
      </label>
      <select ${
        state.waiting && 'disabled="disabled"'
      } id="search-filters-language" class="autocomplete__input autocomplete__input--default" name="search-filters-language">
      ${state.locales.map(
        (code) =>
          `<option value="${code}" ${
            state.searchParams.language === languageName(code) ? 'selected' : ''
          }>${languageName(code)}</option>`
      )}
        </select>
    </div>`

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

const viewMainLinkSearch = () => `
  <div class="govuk-form-group">
    <label class="govuk-label govuk-label--s" for="search-filters-link-search">
      Search for pages that link to
    </label>
    <div class="govuk-hint">
      Use full or partial URLs, for example: https://www.gov.uk/tax-codes or tax-codes
    </div>
    <input
        class="govuk-input"
        id="search-filters-link-search"
        ${state.waiting && 'disabled="disabled"'}
        value="${state.searchParams.linkSearchUrl}"
     />
  </div>
`

const viewLinkSearchInput = () => `
<div class="govuk-form-group">
  <label class="govuk-label govuk-label--s" for="search-filters-link-search">
  Search for pages that link to
  </label>
  <div class="govuk-hint">
      Use full or partial URLs for example, https://www.gov.uk/tax-codes or tax-codes
    </div>
  <input class="govuk-input" id="search-filters-link-search" name="search-filters-link-search" type="text" value="${state.searchParams.linkSearchUrl}">
</div>
`

const viewMainPhoneNumberSearch = function (): string {
  return `
    <div class="govuk-form-group">
      <label class="govuk-label govuk-label--s" for="search-filters-phone-number-search">
        Search for pages that contain the phone number
      </label>
      <div class="govuk-hint">
        Enter a single phone number in any format, with or without spaces or other symbols. It will be standardised when the 'search' button is used.
      </div>
      ${
        state.phoneNumberError
          ? `
      <p id="phone-number-error" class="govuk-error-message">
        <span class="govuk-visually-hidden">Error:</span> Enter a single phone number.
      </p>
      `
          : ''
      }
      <input
          class="govuk-input ${
            state.phoneNumberError ? 'govuk-input--error' : ''
          }"
          id="search-filters-phone-number-search"
          ${state.waiting && 'disabled="disabled"'}
          value="${state.searchParams.phoneNumber}"
       />
    </div>
  `
}

const viewPhoneNumberSearchInput = () => `
<div class="govuk-form-group">
  <label class="govuk-label govuk-label--s" for="search-filters-phone-number-search">
  Search for pages that contain the phone number
  </label>
  <div class="govuk-hint">
      Enter a single phone number in any format, with or without spaces or other symbols. It will be standardised when the 'search' button is used.
    </div>
  ${
    state.phoneNumberError
      ? `
  <p id="phone-number-error" class="govuk-error-message">
    <span class="govuk-visually-hidden">Error:</span> Enter a single phone number.
  </p>
  `
      : ''
  }
  <input
      class="govuk-input ${state.phoneNumberError ? 'govuk-input--error' : ''}"
      id="search-filters-phone-number-search"
      name="search-filters-phone-number-search"
      type="text"
      ${state.waiting && 'disabled="disabled"'}
      value="${state.searchParams.phoneNumber}"
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

const viewLinksExactMatchSelector = () => `
<div class="govuk-form-group">
  <div class="govuk-checkboxes govuk-checkboxes--small">
    <div class="govuk-checkboxes__item">
      <input
          class="govuk-checkboxes__input"
          ${state.waiting && 'disabled="disabled"'}
          type="checkbox"
          id="search-filters-links-exact-match"
          name="search-filters-links-exact-match"
          ${state.searchParams.linksExactMatch ? 'checked' : ''}
      />
      <label for="search-filters-links-exact-match" class="govuk-label govuk-checkboxes__label">Exact matches only</label>
    </div>
  </div>
</div>
`

const viewKeywordsCombinator = (withNegativeMargin = false) => `
<div class="govuk-form-group" ${
  withNegativeMargin ? `style="margin-top: -30px;"` : ''
}>
  <fieldset class="govuk-fieldset">
    <legend class="govuk-fieldset__legend govuk-fieldset__legend--s">
        Search for
    </legend>
    <div class="govuk-radios govuk-radios--small" data-module="govuk-radios">
      <div class="govuk-radios__item">
        <input class="govuk-radios__input" id="search-filters-combinator-1" name="search-filters-combinator" type="radio" value="${
          Combinator.All
        }" ${state.searchParams.combinator === Combinator.All ? 'checked' : ''}>
        <label class="govuk-label govuk-radios__label" for="search-filters-combinator-1">
          All keywords
        </label>
        <div class="govuk-hint govuk-radios__hint">
          Narrows search, for example: cat AND dog
        </div>
      </div>
      <div class="govuk-radios__item">
        <input class="govuk-radios__input" id="search-filters-combinator-2" name="search-filters-combinator" type="radio" value="${
          Combinator.Any
        }" ${state.searchParams.combinator === Combinator.Any ? 'checked' : ''}>
        <label class="govuk-label govuk-radios__label" for="search-filters-combinator-2">
          Any keyword
        </label>
        <div class="govuk-hint govuk-radios__hint">
          Expands search, for example: cat OR dog
        </div>
      </div>
    </div>
  </fieldset>
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
        <option value="" ${
          state.searchParams.publishingApp === '' ? 'selected' : ''
        }>Any</option>
        ${state.publishingApps
          .sort()
          .map(
            (publishingApp) =>
              `<option value="${publishingApp}" ${
                state.searchParams.publishingApp === publishingApp
                  ? 'selected'
                  : ''
              }>${formatPublishingApp(publishingApp)}</option>`
          )}
        </select>
    </div>`

const viewPoliticalStatusSelector = () => `
      <div class="govuk-form-group" data-state="${state.waiting && 'disabled'}">
        <label class="govuk-label govuk-label--s" for="search-filters-political-status">
          Political status
        </label>
        <select ${
          state.waiting && 'disabled="disabled"'
        } id="search-filters-political-status" class="govuk-select" name="search-filters-political-status" style="width: 100%;">
          <option value="${PoliticalStatus.Any}" ${
  state.searchParams.politicalStatus === PoliticalStatus.Any ? 'selected' : ''
}>Any</option>
          <option value="${PoliticalStatus.Political}" ${
  state.searchParams.politicalStatus === PoliticalStatus.Political
    ? 'selected'
    : ''
}>Political</option>
          <option value="${PoliticalStatus.NotPolitical}" ${
  state.searchParams.politicalStatus === PoliticalStatus.NotPolitical
    ? 'selected'
    : ''
}>Not political</option>
        </select>
    </div>`

const viewKeywordsInput = () => `
  <div class="govuk-form-group">
    <label for="keyword" class="govuk-label govuk-label--s">Search for keywords</label>
    <div class="govuk-hint">
    Use quotes for phrases for example, "UK driving licence". Use commas to search for multiple keywords or phrases.
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
