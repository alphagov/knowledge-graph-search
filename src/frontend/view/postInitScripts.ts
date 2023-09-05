/* global accessibleAutocomplete */
import { id } from '../../common/utils/utils'
import { state } from '../state'

declare const window: any

export default function govukPostInitScripts() {
  /**
   * A few evals to set things straight
   * To run once most HTML has been generated
   */

  const initialFocusOnHeading = () => id('results-heading')?.focus()

  const initGovUKFrontendScripts = () => {
    window.GOVUKFrontend.initAll()
  }

  const initAutoComplete = () => {
    const autocomplete = document.querySelectorAll('select.autocomplete__input')

    autocomplete.forEach((el) => {
      const id = el.getAttribute('id')
      if (document.querySelector('#' + id)) {
        const placeholderMapping = {
          'side-filters-publishing-application': 'a publishing application',
          'search-filters-publishing-application': 'a publishing application',
          'side-filters-document-type': 'a document type',
          'search-filters-document-type': 'a document type',
          'side-filters-language': 'a language',
          'search-filters-language': 'a language',
          'side-filters-publishing-organisation': 'an organisation',
          'search-filters-publishing-organisation': 'an organisation',
          'side-filters-taxon': 'a taxon',
          'search-filters-taxon': 'a taxon',
        }
        const placeholder =
          'Start typing ' + placeholderMapping[id] || `a ${id}`

        accessibleAutocomplete.enhanceSelectElement({
          selectElement: document.querySelector('#' + id),
          showAllValues: true,
          dropdownArrow: () =>
            '<svg class="autocomplete__dropdown-arrow-down" style="top: 8px;" viewBox="0 0 512 512"><path d="M256,298.3L256,298.3L256,298.3l174.2-167.2c4.3-4.2,11.4-4.1,15.8,0.2l30.6,29.9c4.4,4.3,4.5,11.3,0.2,15.5L264.1,380.9  c-2.2,2.2-5.2,3.2-8.1,3c-3,0.1-5.9-0.9-8.1-3L35.2,176.7c-4.3-4.2-4.2-11.2,0.2-15.5L66,131.3c4.4-4.3,11.5-4.4,15.8-0.2L256,298.3  z"></path></svg>',
          confirmOnBlur: false,
          placeholder,
          onConfirm: (val) => {
            if (val && document.getElementById('filters')) {
              ;(document.getElementById(id) as HTMLInputElement).value =
                val === 'undefined' ? '' : val
              // document.getElementById('search').click()
            }
          },
        })
      }
    })
  }

  const setAutocompleteInputsDisabled = () => {
    const autocompleteDisabled = document.querySelectorAll(
      '[data-state="disabled"] input'
    )
    autocompleteDisabled.forEach((el) => {
      if (el) {
        el.setAttribute('disabled', 'disabled')
      }
    })
  }

  setTimeout(() => {
    if (window.havePostScriptsRun || state.waiting) {
      return
    }
    initialFocusOnHeading()
    initGovUKFrontendScripts()
    initAutoComplete()
    setAutocompleteInputsDisabled()
    window.havePostScriptsRun = true
  }, 0)
}
