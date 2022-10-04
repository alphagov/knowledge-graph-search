import { state } from '../state.js';
import { viewMetaLink } from './view-components.js';



const viewOrgChild = subOrg =>
  `<li>${viewMetaLink(subOrg)}</li>`;


const viewOrgChildren = childOrgNames =>
  `<details class="govuk-details">
     <summary class="govuk-details__summary">
       <span class="govuk-details__summary-text">
         ${childOrgNames.length} sub-organisations
       </span>
     </summary>
     <div class="govuk-details__text">
       <ul class="govuk-list govuk-list--bullet">${childOrgNames.map(viewOrgChild).join('')}</ul>
     </div>
   </details>`;


const viewBankHolidayDetails = function(holiday) {
  return `
    <details class="govuk-details">
      <summary class="govuk-details__summary">
        <span class="govuk-details__summary-text">
          Dates
        </span>
      </summary>
      <div class="govuk-details__text">
        <ul class="govuk-list govuk-list--bullet">
          ${holiday.dates.map(date => `<li>${date.dateString}</li>`).join('')}
        </ul>
      </div>
    </details>
    <details class="govuk-details">
      <summary class="govuk-details__summary">
        <span class="govuk-details__summary-text">
          Observed in
        </span>
      </summary>
      <div class="govuk-details__text">
        <ul class="govuk-list govuk-list--bullet">
          ${holiday.regions.map(region => `<li>${region}</li>`).join('')}
        </ul>
      </div>
    </details>
  `;
};


const viewBankHoliday = record =>
  `<div class="meta-results-panel">
     <h2 class="govuk-heading-m">
       ${record.name}
     </h2>
     <p class="govuk-body">Bank holiday</p>
     ${viewBankHolidayDetails(record)}
     </div>
  `;


const viewOrg = record =>
  `<div class="meta-results-panel">
     <h2 class="govuk-heading-m">
       <a class="govuk-link" href="${record.homepage}">${record.name}</a>
     </h2>
     <p class="govuk-body">
       Government organisation${record.parentName ? `, part of ${viewMetaLink(record.parentName)}` : ''}
     </p>
     ${record.description ? `<p class="govuk-body">${record.description}</p>` : ''}
     ${record.childOrgNames && record.childOrgNames.length > 0 ?
       viewOrgChildren(record.childOrgNames) :
       '<p class="govuk-body">No sub-organisations</p>'
     }
   </div>`;


//=================== public ====================


const viewMetaResultsExpandToggle = () =>
  state.metaSearchResults.length > 5 ?
    `<button id="meta-results-expand">${state.disambBoxExpanded ? 'show less' : 'show more'}</button>` :
    '';


const viewMetaResults = function() {
  if (!state.metaSearchResults) return;
  if (state.metaSearchResults.length > 1) {
    const expandedClass = state.metaSearchResults.length > 5 && !state.disambBoxExpanded ? 'meta-results-panel--collapsed' : '';
    return `
      <div class="meta-results-panel">
        <div class="meta-results-panel__collapsible ${expandedClass}">
          <h2 class="govuk-heading-s">"${state.selectedWords.replace(/"/g, '')}" can refer to:</h2>
          <ul class="govuk-list govuk-list--bullet">
            ${state.metaSearchResults.map(result => `<li>${viewMetaLink(result.name)} (${result.type.toLowerCase()})</li>`).join('')}
          </ul>
        </div>
        ${viewMetaResultsExpandToggle()}
      </div>
    `;
  } else {
    const record = state.metaSearchResults[0];
    console.log(`meta: found a ${record.type}`)
    switch (record.type) {
      case "BankHoliday": return viewBankHoliday(record);
      case "Organisation": return viewOrg(record);
      default: console.log(`unknown record type: ${record.type}`); return ``;
    }
  }
};


export { viewMetaResults };
