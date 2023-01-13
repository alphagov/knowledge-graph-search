import { state } from '../state';
import { viewMetaLink } from './view-components';
import { MetaResultType, Taxon, Organisation, Transaction, BankHoliday } from '../search-api-types';


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


const viewOrgPersonRoles = (personRoles: Record<string, any>[]) =>
  viewDetails(
    `${personRoles.length} ${personRoles.length === 1 ? 'person' : 'people'}`,
    sortedBy(personRoles, 'personName'),
    personRole => `${viewMetaLink(personRole.personName)} (${viewMetaLink(personRole.roleName)})`
  );


const viewOrgChildren = (childOrgNames: string[]) =>
  viewDetails(
    `${childOrgNames.length} sub-organisations`,
    childOrgNames.sort(),
    viewMetaLink
  );


const viewPersonRoles = function(roles: any[]) {
  const title: string = roles.length === 1 ? 'Role' : 'Roles';
  const roleFormatter: (role: any) => string = role => `
    ${viewMetaLink(role.title)} ${role.orgName ? ' at ' + viewMetaLink(role.orgName) : ''}
    (${role.startDate ? new Date(role.startDate).getFullYear() : ''}
    to ${role.endDate ? new Date(role.endDate).getFullYear() : 'present'})`;
  const rolesInDateOrder = sortedBy(roles, 'startDate').reverse();
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
  let currentsHtml: string;
  switch(currents.length) {
    case 0: currentsHtml = ''; break;
    case 1: currentsHtml = `
      <p class="govuk-body">Current holder:</p>
      <p class="govuk-body-l"><a href="${currents[0].homepage}">${currents[0].name}</a></p>
      <p class="govuk-body">(since ${new Date(currents[0].startDate).getFullYear()})</p>
    `;
    break;
    default: currentsHtml = `
      <p class="govuk-body">Current holders:</p>
      <ul class="govuk-list govuk-list--bullet">
        ${currents.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()).map(person => `<li>${formatPerson(person)}</li>`).join('')}
      </ul>
    `;
  }

  let previousHtml: string;
  switch (previous.length) {
    case 0: previousHtml = ''; break;
    case 1: return `
      <p class="govuk-body">Previous holder: ${formatPerson(previous[0])}</p>
    `; break;
    case 2: return `
      <details class="govuk-details">
        <summary class="govuk-details__summary">
          <span class="govuk-details__summary-text">Previous holders</span>
        </summary>
        <div class="govuk-details__text">
          <ul class="govuk-list govuk-list--bullet">
            ${previous.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()).map(person => `<li>${formatPerson(person)}</li>`).join('')}
          </ul>
        </div>
      </details>
    `;
  }

  return `${currentsHtml} ${previousHtml}`;
};


const viewBankHolidayDetails = function(holiday: any) {
  const datesDetails: string = viewDetails(
    'dates',
    sortedBy(holiday.dates, 'dateString').reverse(),
    date => date.dateString
  );
  const regionDetails: string = viewDetails(
    'Observed in',
    holiday.regions.sort(),
    region => region
  );
  return `${datesDetails}${regionDetails}`;
};


const viewBankHoliday = (record: BankHoliday): string => `
  <div class="meta-results-panel">
    <h2 class="govuk-heading-m">
      ${record.name}
    </h2>
    <p class="govuk-body">Bank holiday</p>
    ${viewBankHolidayDetails(record)}
  </div>
`;

const viewPerson = (record: any) => `
  <div class="meta-results-panel">
    <h2 class="govuk-heading-m">
      <a class="govuk-link" href="${record.homepage}">${record.name}</a>
    </h2>
    <p class="govuk-body">${record.description}</p>
    ${record.roles && record.roles.length > 0 ? viewPersonRoles(record.roles) : ''}
  </div>
`;


const viewRoleOrgs = (orgs: any[]) =>
  viewDetails(
    `belongs to ${orgs.length} ${orgs.length === 1 ? 'organisation' : 'organisations'}`,
    orgs.sort(),
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
  const nameHtml = record.homePage ? `
    <a class="govuk-link" href="${record.homepage}">${record.name}</a>
  ` : record.name;

  return `
    <div class="meta-results-panel">
      <h2 class="govuk-heading-m">${nameHtml}</h2>
      <p class="govuk-body">Official role</p>
      ${record.description ? `<p class="govuk-body">${record.description}</p>` : ''}
      ${viewRoleOrgs(record.orgNames)}
      ${viewRolePersons(record.personNames)}
    </div>`
};


const viewOrg = (record: Organisation): string => `
  <div class="meta-results-panel">
    <h2 class="govuk-heading-m">
      <a class="govuk-link" href="${record.homepage}">${record.name}</a>
    </h2>
    <p class="govuk-body">
      Government organisation${record.parentName ? `, part of ${viewMetaLink(record.parentName)}` : ''}
    </p>
    ${record.supersededBy.length > 0 ? `
      <p class="govuk-body govuk-!-font-weight-bold">
        ${viewMetaLinkList(record.supersededBy, 'Superseded by:')}
      </p>
    ` : ''}
    ${record.description ? `<p class="govuk-body">${record.description}</p>` : ''}
    ${record.childOrgNames && record.childOrgNames.length > 0 ?
      viewOrgChildren(record.childOrgNames) : ''}
    ${record.personRoleNames && record.personRoleNames.length > 0 ?
      viewOrgPersonRoles(record.personRoleNames) : ''}
    ${record.supersedes.length > 0 ? `
    <p class="govuk-body">${viewMetaLinkList(record.supersedes, 'Supersedes: ')}</p>
    ` : ''}
  </div>
`;


const viewMetaLinkList = (names: string[], title?: string, noneTitle?: string): string => {
  if (names.length === 0 && noneTitle) {
    return noneTitle;
  } else if (names.length === 1) {
    return `
      ${title?.length > 0 ? title : ''}
      ${viewMetaLink(names[0])}
    `;
  } else {
    return `
      ${title?.length > 0 ? title : ''}
      <ul class="govuk-list govuk-list--bullet">
        ${names.map(name => `<li>${viewMetaLink(name)}</li>`).join('')}
      </ul>
    `;
  }
};


const viewTransaction = (record: Transaction): string => `
  <div class="meta-results-panel">
    <h2 class="govuk-heading-m">
      <a class="govuk-link" href="${record.homepage}">${record.name}</a>
    </h2>
    <p class="govuk-body">Online government service</p>
    ${record.description ? `<p class="govuk-body">${record.description}</p>` : ''}
  </div>
`;


const viewTaxon = (record: Taxon): string => {
  return `
    <div class="meta-results-panel">
      <div class="govuk-breadcrumbs">
        <ol class="govuk-breadcrumbs__list">
          ${sortedBy(record.ancestorTaxons, 'level').map(taxon => `
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
    </div>
  `;
}


const viewTaxonChildren = (records: any[]): string => {
  return viewDetails(
    'Subtaxons',
    sortedBy(records, 'name'),
    taxon => viewMetaLink(taxon.name)
  );
}

// Sorts a list of object using a specific field to sort by
const sortedBy = function(arrayOfObjects: Record<string, any>[], field: string): Record<string, any>[] {
  const deepCopy = JSON.parse(JSON.stringify(arrayOfObjects));
  return deepCopy.sort((a, b) => a[field] < b[field] ? -1 : 1);
}

/*
const viewMetaResultsExpandToggle = () =>
  state.metaSearchResults && state.metaSearchResults.length > 5
    ? `<button id = "meta-results-expand">${state.disamboxExpanded ? 'show less' : 'show more'}</button>`
    : '';
*/


//=================== public ====================

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
    case MetaResultType.BankHoliday: return viewBankHoliday(record);
    case MetaResultType.Organisation: return viewOrg(record);
    case MetaResultType.Person: return viewPerson(record);
    case MetaResultType.Role: return viewRole(record);
    case MetaResultType.Transaction: return viewTransaction(record);
    case MetaResultType.Taxon: return viewTaxon(record);
    default: console.log(`unknown record type: ${record.type}`); return ``;
  }
  //}
};


export { viewMetaResults };
