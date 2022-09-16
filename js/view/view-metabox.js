import { state } from '../state.js';
import { viewMetaLink } from './view-components.js';


const viewOrgPersonRoles = (personRoles) =>
  `<details class="govuk-details">
     <summary class="govuk-details__summary">
       <span class="govuk-details__summary-text">
         ${personRoles.length} ${personRoles.length === 1 ? 'person' : 'people'}
       </span>
     </summary>
     <div class="govuk-details__text">
       <ul class="govuk-list govuk-list--bullet">
         ${personRoles.map(personRole => `<li>${viewMetaLink(personRole.personName)} (${personRole.roleName})</li>`).join('')}
       </ul>
     </div>
   </details>`;


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


const viewPersonRoles = function(roles) {
  return `
    <details class="govuk-details">
      <summary class="govuk-details__summary">
        <span class="govuk-details__summary-text">
          Roles
        </span>
      </summary>
      <div class="govuk-details__text">
        <ul class="govuk-list govuk-list--bullet">${roles.map(role => `
          <li>${role.name} at ${viewMetaLink(role.orgName)}
            (from ${role.startDate ? role.startDate.getFullYear() : ''}
            to ${role.endDate ? role.endDate.getFullYear() : 'now'})
          </li>`).join('')}
        </ul>
      </div>
    </details>`;
};


const viewRolePersons = persons => {
  const formatPerson = person => `
    ${viewMetaLink(person.personName)}
    (from ${person.roleStartDate ? person.roleStartDate.getFullYear() : ''}
    to
    ${person.roleEndDate ? person.roleEndDate.getFullYear() : 'now'})
  `;
  const currents = persons.filter(person => person.roleEndDate === null);
  const previous = persons.filter(person => person.roleEndDate !== null);

  const currentsHtml = currents.length === 0 ?
    '<p class="govuk-body-l">No current holder</p>' :
    (currents.length === 1 ?
      `<p class="govuk-body-l">${formatPerson(currents[0])}</p>` :
      `<ul class="govuk-list govuk-list--bullet">
         ${currents.sort((a,b) => b.roleStartDate.getTime() - a.roleStartDate.getTime()).map(person => `<li>${formatPerson(person)}</li>`).join('')}
       </ul>
  `);

  const previousHtml = previous.length === 0 ?
    '<p class="govuk-body">No previous holders</p>' :
    (previous.length === 1 ? `
     <p class="govuk-body">Previous holder: ${formatPerson(previous[0])}</p>` : `
      <details class="govuk-details">
        <summary class="govuk-details__summary">
          <span class="govuk-details__summary-text">
            Previous holders
          </span>
        </summary>
        <div class="govuk-details__text">
          <ul class="govuk-list govuk-list--bullet">
            ${previous.sort((a,b) => b.roleStartDate.getTime() - a.roleStartDate.getTime()).map(person => `<li>${formatPerson(person)}</li>`).join('')}
          </ul>
        </div>
      </details>
  `);

  return `${currentsHtml} ${previousHtml}`;
};


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
          ${holiday.dates.map(dateString => `<li>${dateString}</li>`).join('')}
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


const viewPerson = record =>
  `<div class="meta-results-panel">
     <h2 class="govuk-heading-m">
       <a class="govuk-link" href="${record.homepage}">${record.name}</a>
     </h2>
     ${record.roles && record.roles.length > 0 ? viewPersonRoles(record.roles) : ''}
   </div>`;


const viewRole = function(record) {
  const nameHtml = record.homePage ?
    `<a class="govuk-link" href="${record.homepage}">${record.name}</a>` :
     record.name;
  const orgsHtml = record.orgNames.map(viewMetaLink).join(', ');

  return `
    <div class="meta-results-panel">
      <h2 class="govuk-heading-m">${nameHtml}</h2>
      <p class="govuk-body">Official role under ${orgsHtml}</p>
      ${record.persons && record.persons.length > 0 ? viewRolePersons(record.persons) : '' }

    </div>`
};


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
     ${record.personRoleNames && record.personRoleNames.length > 0 ?
       viewOrgPersonRoles(record.personRoleNames) : ''
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
      case "Person": return viewPerson(record);
      case "Role": return viewRole(record);
      default: console.log(`unknown record type: ${record.type}`); return ``;
    }
  }
};


export { viewMetaResults };
