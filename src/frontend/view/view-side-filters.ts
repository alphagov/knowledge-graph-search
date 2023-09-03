import {
  Combinator,
  KeywordLocation,
  PublishingApplication,
  PublishingStatus,
} from '../../common/types/search-api-types'
import { state } from '../state'
import { languageName } from '../../common/utils/lang'

const viewCombinatorRadios = () => `
<div class="govuk-form-group">
  <fieldset class="govuk-fieldset">
    <legend class="govuk-fieldset__legend govuk-fieldset__legend--s">
        Search for
    </legend>
    <div class="govuk-radios govuk-radios--small" data-module="govuk-radios">
      <div class="govuk-radios__item">
        <input class="govuk-radios__input" id="filter-combinator-1" name="filter-combinator" type="radio" value="${
          Combinator.All
        }" ${state.searchParams.combinator === Combinator.All ? 'checked' : ''}>
        <label class="govuk-label govuk-radios__label" for="filter-combinator">
          All keywords
        </label>
        <div class="govuk-hint govuk-radios__hint">
            Narrows search eg, dog and cat
          </div>
      </div>
      <div class="govuk-radios__item">
        <input class="govuk-radios__input" id="filter-combinator-2" name="filter-combinator" type="radio" value="${
          Combinator.Any
        }" ${state.searchParams.combinator === Combinator.Any ? 'checked' : ''}>
        <label class="govuk-label govuk-radios__label" for="filter-combinator">
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

const viewExcludeWords = () => `
<div class="govuk-form-group">
  <label class="govuk-label govuk-label--s" for="filter-excluded-keywords">
    Excluding these words
  </label>
  <input class="govuk-input" id="filter-excluded-keywords" name="filter-excluded-keywords" type="text" value="${state.searchParams.excludedWords}">
</div>
`

const viewSelectKeywordLocation = () => `
<div class="govuk-form-group">
  <label class="govuk-label govuk-label--s" for="filter-keyword-location">
    Keyword location
  </label>
  <select class="govuk-select" id="filter-keyword-location" name="filter-keyword-location" style="width: 100%;">
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

const viewSelectPublishingOrganisations = () => {
  const html = [
    `
    <div class="govuk-form-group" data-state="${state.waiting && 'disabled'}">
      <label class="govuk-label govuk-label--s" for="filter-publishing-organisation">
        Publishing organisations
      </label>
      <select ${
        state.waiting && 'disabled="disabled"'
      } id="filter-publishing-organisation" class="autocomplete__input autocomplete__input--default" name="filter-publishing-organisation">
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

const viewDocumentTypeSelector = () => {
  const html = [
    `
    <div class="govuk-form-group" data-state="${state.waiting && 'disabled'}">
      <label class="govuk-label govuk-label--s" for="filter-document-type">
        Document type
      </label>
      <select ${
        state.waiting && 'disabled="disabled"'
      } id="filter-document-type" class="autocomplete__input autocomplete__input--default" name="documentType">
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

const viewPublishingApplications = () => `
      <div class="govuk-form-group" data-state="${state.waiting && 'disabled'}">
        <label class="govuk-label govuk-label--s" for="filter-publishing-application">
          Publishing applications
        </label>
        <select ${
          state.waiting && 'disabled="disabled"'
        } id="filter-publishing-application" class="govuk-select" name="filter-publishing-application" style="width: 100%;">
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

const viewTaxonSelector = () => `
    <div class="govuk-form-group" data-state="${state.waiting && 'disabled'}">
      <label class="govuk-label govuk-label--s" for="filter-taxon">
        Taxons
      </label>
      <select ${
        state.waiting && 'disabled="disabled"'
      } id="filter-taxon" class="autocomplete__input autocomplete__input--default" name="filter-taxon">
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

const viewLanguageSelector = () => `
    <div class="govuk-form-group" data-state="${state.waiting && 'disabled'}">
      <label class="govuk-label govuk-label--s" for="filter-language">
        Languages
      </label>
      <select ${
        state.waiting && 'disabled="disabled"'
      } id="filter-language" class="autocomplete__input autocomplete__input--default" name="filter-language">
      ${state.locales.map(
        (code) =>
          `<option value="${code}" ${
            state.searchParams.selectedLocale === languageName(code)
              ? 'selected'
              : ''
          }>${languageName(code)}</option>`
      )}
        </select>
    </div>`

const viewPublishingStatusSelector = () => `
      <div class="govuk-form-group" data-state="${state.waiting && 'disabled'}">
        <label class="govuk-label govuk-label--s" for="filter-publishing-status">
          Publishing status
        </label>
        <select ${
          state.waiting && 'disabled="disabled"'
        } id="filter-publishing-status" class="govuk-select" name="filter-publishing-status" style="width: 100%;">
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
}>Non-withdrawn</option>
        </select>
    </div>`

export const viewSideFilters = () => {
  const submitButton = () => `
      <button id="filters-pane-submit-btn" class="govuk-button" data-module="govuk-button" style="width: auto;">Apply filters</button>
    `
  const viewClearFilters = () =>
    `<a href="javascript:void(0)" id="clear-filters" class="govuk-link">Clear filters</a>`

  return `
    <div class="filters-pane">
      <h2 class="govuk-heading-m">Filters</h2>
      ${viewCombinatorRadios()}
      ${viewExcludeWords()}
      ${viewSelectKeywordLocation()}
      ${viewSelectPublishingOrganisations()}
      ${viewDocumentTypeSelector()}
      ${viewPublishingApplications()}
      ${viewTaxonSelector()}
      ${viewLanguageSelector()}
      ${viewPublishingStatusSelector()}
      ${submitButton()}
      ${viewClearFilters()}
    </div>
    `
}
