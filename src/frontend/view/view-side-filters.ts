import {
  Combinator,
  KeywordLocation,
  PublishingStatus,
  PoliticalStatus,
  SearchType,
} from '../../common/types/search-api-types'
import { state } from '../state'
import { languageName } from '../../common/utils/lang'
import { formatDocumentType, formatPublishingApp } from '../utils/formatters'

const viewEnableCaseSensitive = () => `
<div class="govuk-form-group side-filter-case-sensitive">
  <div class="govuk-checkboxes govuk-checkboxes--small">
    <div class="govuk-checkboxes__item">
      <input
          class="govuk-checkboxes__input"
          ${state.waiting && 'disabled="disabled"'}
          type="checkbox"
          id="side-filters-case-sensitive"
          name="side-filters-case-sensitive"
          ${state.searchParams.caseSensitive ? 'checked' : ''}
      />
      <label for="side-filters-case-sensitive" class="govuk-label govuk-checkboxes__label">Enable case sensitive</label>
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
          id="side-filters-links-exact-match"
          name="side-filters-links-exact-match"
          ${state.searchParams.linksExactMatch ? 'checked' : ''}
      />
      <label for="side-filters-links-exact-match" class="govuk-label govuk-checkboxes__label">Exact matches only</label>
    </div>
  </div>
</div>  
`

const viewCombinatorRadios = () => `
  <fieldset class="govuk-fieldset side-filter-fieldset">
    <legend class="govuk-fieldset__legend govuk-fieldset__legend--s">
        Search for
    </legend>
    <div class="govuk-radios govuk-radios--small" data-module="govuk-radios">
      <div class="govuk-radios__item">
        <input class="govuk-radios__input" id="side-filters-combinator-1" name="side-filters-combinator" type="radio" value="${
          Combinator.All
        }" ${state.searchParams.combinator === Combinator.All ? 'checked' : ''}>
        <label class="govuk-label govuk-radios__label" for="side-filters-combinator-1">
          All keywords
        </label>
        <div class="govuk-hint govuk-radios__hint">
          Narrows search, for example: cat AND dog
        </div>
      </div>
      <div class="govuk-radios__item">
        <input class="govuk-radios__input" id="side-filters-combinator-2" name="side-filters-combinator" type="radio" value="${
          Combinator.Any
        }" ${state.searchParams.combinator === Combinator.Any ? 'checked' : ''}>
        <label class="govuk-label govuk-radios__label" for="side-filters-combinator-2">
          Any keyword
        </label>
        <div class="govuk-hint govuk-radios__hint">
          Expands search, for example: cat OR dog
        </div>
      </div>
    </div>
  </fieldset>
`

const viewExcludeWords = () => `
<div class="govuk-form-group">
  <label class="govuk-label govuk-label--s" for="side-filters-excluded-keywords">
    Excluding these words
  </label>
  <input class="govuk-input" id="side-filters-excluded-keywords" name="side-filters-excluded-keywords" type="text" value="${state.searchParams.excludedWords}">
</div>
`

const viewSelectKeywordLocation = () => `
<div class="govuk-form-group">
  <label class="govuk-label govuk-label--s" for="side-filters-keyword-location">
    Keyword location
  </label>
  <select class="govuk-select" id="side-filters-keyword-location" name="side-filters-keyword-location" style="width: 100%;">
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
    <label class="govuk-label govuk-label--s" for="side-filters-publishing-organisation">
      Publishing organisations
    </label>
    <select ${
      state.waiting && 'disabled="disabled"'
    } id="side-filters-publishing-organisation" class="autocomplete__input autocomplete__input--default" name="side-filters-publishing-organisation">
      <option value="" ></option>
      ${options}
    </select>
  </div>
  `

  return html
}

const viewDocumentTypeSelector = () => {
  const html = [
    `
    <div class="govuk-form-group" data-state="${state.waiting && 'disabled'}">
      <label class="govuk-label govuk-label--s" for="side-filters-document-type">
        Document type
      </label>
      <select ${
        state.waiting && 'disabled="disabled"'
      } id="side-filters-document-type" class="autocomplete__input autocomplete__input--default" name="side-filters-document-type">
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
              }>${formatDocumentType(documentType)}</option>`
          )
      )}
        </select>
    </div>`)
  return html.join('')
}

const viewPublishingApplications = () => `
      <div class="govuk-form-group" data-state="${state.waiting && 'disabled'}">
        <label class="govuk-label govuk-label--s" for="side-filters-publishing-application">
          Publishing applications
        </label>
        <select ${
          state.waiting && 'disabled="disabled"'
        } id="side-filters-publishing-application" class="govuk-select" name="side-filters-publishing-application" style="width: 100%;">
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

const viewTaxonSelector = () => `
    <div class="govuk-form-group" data-state="${state.waiting && 'disabled'}">
      <label class="govuk-label govuk-label--s" for="side-filters-taxon">
        Topic tags
      </label>
      <select ${
        state.waiting && 'disabled="disabled"'
      } id="side-filters-taxon" class="autocomplete__input autocomplete__input--default" name="side-filters-taxon">
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
      <label class="govuk-label govuk-label--s" for="side-filters-person">
      Associated Person 
      </label>
      <select ${
        state.waiting && 'disabled="disabled"'
      } id="side-filters-person" class="autocomplete__input autocomplete__input--default" name="side-filters-person">
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

const viewLanguageSelector = () => `
    <div class="govuk-form-group" data-state="${state.waiting && 'disabled'}">
      <label class="govuk-label govuk-label--s" for="side-filters-language">
        Languages
      </label>
      <select ${
        state.waiting && 'disabled="disabled"'
      } id="side-filters-language" class="autocomplete__input autocomplete__input--default" name="side-filters-language">
      ${state.locales.map(
        (code) =>
          `<option value="${code}" ${
            state.searchParams.language === languageName(code) ? 'selected' : ''
          }>${languageName(code)}</option>`
      )}
        </select>
    </div>`

const viewPublishingStatusSelector = () => `
      <div class="govuk-form-group" data-state="${state.waiting && 'disabled'}">
        <label class="govuk-label govuk-label--s" for="side-filters-publishing-status">
          Publishing status
        </label>
        <select ${
          state.waiting && 'disabled="disabled"'
        } id="side-filters-publishing-status" class="govuk-select" name="side-filters-publishing-status" style="width: 100%;">
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

const viewPoliticalStatusSelector = () => `
      <div class="govuk-form-group" data-state="${state.waiting && 'disabled'}">
        <label class="govuk-label govuk-label--s" for="side-filters-political-status">
          Political status
        </label>
        <select ${
          state.waiting && 'disabled="disabled"'
        } id="side-filters-political-status" class="govuk-select" name="side-filters-political-status" style="width: 100%;">
          <option value="${PoliticalStatus.Any}" ${
  state.searchParams.politicalStatus === PoliticalStatus.Any ? 'selected' : ''
}>All statuses</option>
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

const viewGovernmentSelector = () => {
  const html = [
    `
    <div class="govuk-form-group" data-state="${state.waiting && 'disabled'}">
      <label class="govuk-label govuk-label--s" for="side-filters-government">
        Government
      </label>
      <select ${
        state.waiting && 'disabled="disabled"'
      } id="side-filters-government" class="autocomplete__input autocomplete__input--default" name="side-filters-government">
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

export const viewSideFilters = () => {
  const limitedSearchTypes = [
    SearchType.Link,
    SearchType.Organisation,
    SearchType.Taxon,
  ]
  const { searchType } = state.searchParams

  const submitButton = () => `
      <button id="side-filters-submit-btn" class="govuk-button" data-module="govuk-button" style="width: auto;">Apply filters</button>
    `
  const viewClearFilters = () =>
    `<a href="javascript:void(0)" id="clear-side-filters-link " class="govuk-link">Clear filters</a>`
  return `
    <div class="side-filters">
      <h2 class="govuk-heading-m">Filters</h2>
      ${
        !limitedSearchTypes.includes(searchType)
          ? viewEnableCaseSensitive()
          : ''
      }
      ${!limitedSearchTypes.includes(searchType) ? viewCombinatorRadios() : ''}
      ${!limitedSearchTypes.includes(searchType) ? viewExcludeWords() : ''}
      ${
        !limitedSearchTypes.includes(searchType)
          ? viewSelectKeywordLocation()
          : ''
      }
      ${searchType === SearchType.Link ? viewLinksExactMatchSelector() : ''}
      ${viewSelectPublishingOrganisations()}
      ${viewDocumentTypeSelector()}
      ${viewPublishingApplications()}
      ${viewTaxonSelector()}
      ${viewLanguageSelector()}
      ${viewPersonSelector()}
      ${viewPublishingStatusSelector()}
      ${viewPoliticalStatusSelector()}
      ${viewGovernmentSelector()}
      ${submitButton()}
      ${viewClearFilters()}
    </div>
    `
}
