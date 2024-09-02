import { id } from '../../common/utils/utils'

export default function govukPostInitScripts() {
  // A few evals to set things straight
  // To run once most HTML has been generated
  // focus on the results heading if present
  id('results-heading')?.focus()

  // init GOVUKFrontend scripts
  // eval('window.GOVUKFrontend.initAll()')

  // init autocomplete inputs
  eval(`
    var autocomplete = document.querySelectorAll('select.autocomplete__input');

    var placeholderMapping = {
      'side-filters-publishing-application': 'a publishing application',
      'search-filters-publishing-application': 'a publishing application',
      'side-filters-document-type': 'a document type',
      'search-filters-document-type': 'a document type',
      'side-filters-language': 'a language',
      'search-filters-language': 'a language',
      'side-filters-publishing-organisation': 'an organisation',
      'search-filters-publishing-organisation': 'an organisation',
      'side-filters-taxon': 'a topic tag',
      'search-filters-taxon': 'a topic tag',
      'search-filters-person': 'a person',
      'side-filters-person': 'a person',
      'side-filters-government': 'a government',
      'search-filters-government': 'a government',
    }

    var getPlaceholder = (id) => 'Start typing ' + placeholderMapping[id] || "a " + id

    autocomplete.forEach(el => {
      var id = el.getAttribute('id')
        if(document.querySelector('#'+id)){
          accessibleAutocomplete.enhanceSelectElement({
            selectElement: document.querySelector('#'+id),
            // showAllValues: true,
            // dropdownArrow: () => '<svg class="autocomplete__dropdown-arrow-down" style="top: 8px;" viewBox="0 0 512 512"><path d="M256,298.3L256,298.3L256,298.3l174.2-167.2c4.3-4.2,11.4-4.1,15.8,0.2l30.6,29.9c4.4,4.3,4.5,11.3,0.2,15.5L264.1,380.9  c-2.2,2.2-5.2,3.2-8.1,3c-3,0.1-5.9-0.9-8.1-3L35.2,176.7c-4.3-4.2-4.2-11.2,0.2-15.5L66,131.3c4.4-4.3,11.5-4.4,15.8-0.2L256,298.3  z"></path></svg>',
            // confirmOnBlur: false,
            placeholder: getPlaceholder(id),
            onConfirm: (val) => {
              if(val && document.getElementById("filters")){
                document.getElementById(id).value = (val == 'undefined' ? '' : val);
                //document.getElementById("search").click()
              }
            }
          })
        }
    });
    `)

  // set autocomplete inputs disabled
  eval(`
      const autocompleteDisabled = document.querySelectorAll('[data-state="disabled"] input');
      autocompleteDisabled.forEach(el => {
        if(el){
          el.setAttribute('disabled', 'disabled');
        }
      });
      `)
}
