import { state } from '../state';
import { viewMetaLink } from './view-components';
import { MetaResult, ResultTaxon } from '../search-api-types';


const viewDetails = (title: string, list: any[], itemFormatFn: (item: any) => string) => {
  if (list.length === 0) return '';
  return `
    <details class="govuk-details">
      <summary class="govuk-details__summary">
        <span class="govuk-details__summary-text">
          ${title}
        </span>
      </summary>
      <div class="govuk-details__text">
        <ul class="govuk-list govuk-list--bullet">
          ${list.map(item => `<li>${itemFormatFn(item)}</li>`).join('')}
        </ul>
      </div>
    </details>
  `;
};


const viewOrgPersonRoles = (personRoles: any[]) =>
  viewDetails(
    `${personRoles.length} ${personRoles.length === 1 ? 'person' : 'people'}`,
    personRoles,
    personRole => `${viewMetaLink(personRole.personName)} (${viewMetaLink(personRole.roleName)})`
  );


const viewOrgChildren = (childOrgNames: string[]) =>
  viewDetails(
    `${childOrgNames.length} sub-organisations`,
    childOrgNames,
    viewMetaLink
  );


const viewPersonRoles = function(roles: any[]) {
  const title: string = roles.length === 1 ? 'Role' : 'Roles';
  const roleFormatter: (role: any) => string = role => `
    ${viewMetaLink(role.title)} ${role.orgName ? ' at ' + viewMetaLink(role.orgName) : ''}
    (${role.startDate ? new Date(role.startDate).getFullYear() : ''}
    to ${role.endDate ? new Date(role.endDate).getFullYear() : 'present'})`;
  const rolesInDateOrder = roles.sort((r1, r2) => r2.startDate - r1.startDate);
  return viewDetails(title, rolesInDateOrder, roleFormatter);
};


const viewRolePersons = (persons: any[]) => {
  const formatPerson = (person: any) => {
    return `
    ${viewMetaLink(person.name)}
    (${person.startDate ? new Date(person.startDate).getFullYear() : ''}
    to
    ${person.endDate ? new Date(person.endDate).getFullYear() : 'now'})
  `};
  const currents = persons.filter((person: any) => person.endDate === null);
  const previous = persons.filter((person: any) => person.endDate !== null);
  const currentsHtml = currents.length === 0 ?
    '<p class="govuk-body-l">No current holder</p>' :
    (currents.length === 1 ?
      `<p class="govuk-body">Current holder:</p>
       <p class="govuk-body-l"><a href="${currents[0].homepage}">${currents[0].name}</a></p>
       <p class="govuk-body">(since ${new Date(currents[0].startDate).getFullYear()})</p>
        ` :
      `<ul class="govuk-list govuk-list--bullet" >
    ${currents.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()).map(person => `<li>${formatPerson(person)}</li>`).join('')}
  </ul>
    `);

  const previousHtml = previous.length === 0 ?
    '<p class="govuk-body">No previous holders</p>' :
    (previous.length === 1 ? `
    <p class="govuk-body" > Previous holder: ${formatPerson(previous[0])} </p>` : `
    <details class="govuk-details" >
      <summary class="govuk-details__summary" >
        <span class="govuk-details__summary-text" >
          Previous holders
        </span>
      </summary>
      <div class="govuk-details__text" >
        <ul class="govuk-list govuk-list--bullet" >
          ${previous.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()).map(person => `<li>${formatPerson(person)}</li>`).join('')}
        </ul>
      </div>
    </details>
  `);

  return `${currentsHtml} ${previousHtml} `;
};


const viewBankHolidayDetails = function(holiday: any) {
  const datesDetails: string = viewDetails(
    'dates',
    holiday.dates,
    date => date.dateString
  );
  const regionDetails: string = viewDetails(
    'Observed in',
    holiday.regions,
    region => region
  );
  return `${datesDetails}${regionDetails} `;
};


const viewBankHoliday = (record: MetaResult): string =>
  `<div class="meta-results-panel" >
    <h2 class="govuk-heading-m" >
      ${record.name}
  </h2>
    <p class="govuk-body" > Bank holiday </p>
     ${viewBankHolidayDetails(record)}
  </div>
    `;

const viewPerson = (record: any) =>
  `<div class="meta-results-panel" >
    <h2 class="govuk-heading-m" >
      <a class="govuk-link" href="${record.homepage}" > ${record.name} </a>
        </h2>
        <p class="govuk-body" > ${record.description} </p>
     ${record.roles && record.roles.length > 0 ? viewPersonRoles(record.roles) : ''}
  </div>`;


const viewRoleOrgs = (orgs: any[]) =>
  viewDetails(
    `belongs to ${orgs.length} ${orgs.length === 1 ? 'organisation' : 'organisations'}`,
    orgs,
    viewMetaLink
  );


/*
const viewRolePersons = (persons: any[]) =>
  viewDetails(
    `${persons.length} ${persons.length === 1 ? 'person' : 'people'}`,
    persons,
    viewMetaLink
  );
*/

const viewRole = function(record: any) {
  const nameHtml = record.homePage ?
    `<a class="govuk-link" href="${record.homepage}">${record.name}</a>` :
    record.name;

  return `
    <div class="meta-results-panel">
      <h2 class="govuk-heading-m">${nameHtml}</h2>
      <p class="govuk-body">Official role</p>
      ${record.description ? `<p class="govuk-body">${record.description}</p>` : ''}
      ${viewRoleOrgs(record.orgNames)}
      ${viewRolePersons(record.personNames)}
    </div>`
};


const viewOrg = (record: MetaResult): string =>
  `<div class="meta-results-panel">
     <h2 class="govuk-heading-m">
       <a class="govuk-link" href="${record.homepage}">${record.name}</a>
     </h2>
     <p class="govuk-body">
       Government organisation${record.parentName ? `, part of ${viewMetaLink(record.parentName)}` : ''}
     </p>
     ${record.description ? `<p class="govuk-body">${record.description}</p>` : ''}
     ${record.childOrgNames && record.childOrgNames.length > 0 ?
    viewOrgChildren(record.childOrgNames) : ''}
     ${record.personRoleNames && record.personRoleNames.length > 0 ?
    viewOrgPersonRoles(record.personRoleNames) : ''}
   </div>`;


const viewTransaction = (record: MetaResult): string =>
  `<div class="meta-results-panel">
     <h2 class="govuk-heading-m">
       <a class="govuk-link" href="${record.homepage}">${record.name}</a>
     </h2>
     <p class="govuk-body">Online government service</p>
     ${record.description ? `<p class="govuk-body">${record.description}</p>` : ''}
   </div>`;


const viewTaxon = (record: MetaResult): string =>
  `<div class="meta-results-panel">
     <div class="govuk-breadcrumbs">
       <ol class="govuk-breadcrumbs__list">
         ${record.ancestorTaxons.map(taxon => `
         <li class="govuk-breadcrumbs__list-item">
           ${viewMetaLink(taxon.name, 'govuk-breadcrumbs__link')}
         </li>
         `)}
       </ol>
     </div>
     <h2 class="govuk-heading-m">
       <a class="govuk-link" href="${record.homepage}">${record.name}</a>
     </h2>
     <p class="govuk-body">GOV.UK Taxon</p>
     ${record.description ? `<p class="govuk-body">${record.description}</p>` : ''}
     ${record.childTaxons?.length ? viewTaxonChildren(record.childTaxons) : ''}
   </div>`;


const viewTaxonChildren = (records: ResultTaxon[]): string =>
  viewDetails(
    'Subtaxons',
    records,
    taxon => viewMetaLink(taxon.name)
  );


//=================== public ====================


const viewMetaResultsExpandToggle = () =>
  state.metaSearchResults && state.metaSearchResults.length > 5 ?
    `< button id = "meta-results-expand" > ${state.disamboxExpanded ? 'show less' : 'show more'} < /button>` :
    '';


const viewMetaResults = function() {
  if (!state.metaSearchResults) return;
  //  if (state.metaSearchResults.length > 1) {
  //    const expandedClass = state.metaSearchResults.length > 5 && !state.disamboxExpanded ? 'meta-results-panel--collapsed' : '';
  //    return `
  //      <div class="meta-results-panel">
  //        <div class="meta-results-panel__collapsible ${expandedClass}">
  //          <h2 class="govuk-heading-s">"${state.selectedWords.replace(/"/g, '')}" can refer to:</h2>
  //          <ul class="govuk-list govuk-list--bullet">
  //            ${state.metaSearchResults.map(result => `<li>${viewMetaLink(result.name)}: (${result.type.toLowerCase()})</li>`).join('')}
  //          </ul>
  //        </div>
  //        ${viewMetaResultsExpandToggle()}
  //      </div>
  //    `;
  //  } else {
  const record = state.metaSearchResults[0];
  console.log(`meta: found a ${record.type}`)
  switch (record.type) {
    case "BankHoliday": return viewBankHoliday(record);
    case "Organisation": return viewOrg(record);
    case "Person": return viewPerson(record);
    case "Role": return viewRole(record);
    case "Transaction": return viewTransaction(record);
    case "Taxon": return viewTaxon(record);
    default: console.log(`unknown record type: ${record.type}`); return ``;
  }
  //}
};


export { viewMetaResults };
