import { state } from '../state';
import { viewMetaLink } from './view-components';
import { Taxon, Organisation, Transaction, BankHoliday } from '../search-api-types';


const viewDetails = (title: string, list: any[], itemFormatFn: (item: any) => string): string => {
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


const viewOrgPersonRoles = (personRoles: Record<string, any>[]): string =>
  viewDetails(
    `${personRoles.length} ${personRoles.length === 1 ? 'person' : 'people'}`,
    sortedBy(personRoles, 'personName'),
    personRole => `${viewMetaLink(personRole.personName)} (${viewMetaLink(personRole.roleName)})`
  );


const viewOrgChildren = (childOrgNames: string[]): string =>
  viewDetails(
    `${childOrgNames.length} sub-organisations`,
    childOrgNames.sort(),
    viewMetaLink
  );


const viewPersonRoles = function(roles: any[]): string {
  const title: string = roles.length === 1 ? 'Role' : 'Roles';
  const roleFormatter: (role: any) => string = role => `
    ${viewMetaLink(role.title)} ${role.orgs ? ' at ' + viewMetaLink(role.orgs[0].orgName) : ''}
    (${role.startDate ? new Date(role.startDate.value).getFullYear() : ''}
    to ${role.endDate ? new Date(role.endDate.value).getFullYear() : 'present'})`;
  const rolesInDateOrder = sortedBy(roles, 'startDate').reverse();
  return viewDetails(title, rolesInDateOrder, roleFormatter);
};


const viewRolePersons = (persons: any[]): string => {
  const formatPerson = (person: any): string => {
    return `
    ${viewMetaLink(person.name)}
    (${person.startDate ? new Date(person.startDate.value).getFullYear() : ''}
    to
    ${person.endDate ? new Date(person.endDate.value).getFullYear() : 'now'})
  `};
  const currents = persons.filter((person: any) => person.endDate === null);
  const previous = persons.filter((person: any) => person.endDate !== null);
  let currentsHtml: string;
  switch(currents.length) {
    case 0: currentsHtml = ''; break;
    case 1: currentsHtml = `
      <p class="govuk-body">Current holder:</p>
      <p class="govuk-body"><a href="${currents[0].homepage}">${currents[0].name}</a></p>
      <p class="govuk-body">(since ${new Date(currents[0].startDate.value).getFullYear()})</p>
    `;
    break;
    default: currentsHtml = `
      <p class="govuk-body">Current holders:</p>
      <ul class="govuk-list govuk-list--bullet">
        ${currents.sort((a, b) => new Date(b.startDate.value).getTime() - new Date(a.startDate.value).getTime()).map(person => `<li>${formatPerson(person)}</li>`).join('')}
      </ul>
    `;
  }

  let previousHtml: string;
  switch (previous.length) {
    case 0: previousHtml = ''; break;
    case 1: previousHtml = `
      <p class="govuk-body">Previous holder: ${formatPerson(previous[0])}</p>
    `;
    default: previousHtml = `
      <details class="govuk-details">
        <summary class="govuk-details__summary">
          <span class="govuk-details__summary-text">Previous holders</span>
        </summary>
        <div class="govuk-details__text">
          <ul class="govuk-list govuk-list--bullet">
            ${previous.sort((a, b) => new Date(b.startDate.value).getTime() - new Date(a.startDate.value).getTime()).map(person => `<li>${formatPerson(person)}</li>`).join('')}
          </ul>
        </div>
      </details>
    `;
  }

  return `${currentsHtml} ${previousHtml}`;
};


const viewBankHolidayDetails = function(holiday: BankHoliday): string {
  const datesDetails: string = viewDetails(
    'dates',
    holiday.dates.sort().reverse(),
    date => date
  );
  const divisionDetails: string = viewDetails(
    'Observed in',
    holiday.divisions.sort(),
    division => division
  );
  return `${datesDetails}${divisionDetails}`;
};


const viewBankHoliday = (record: BankHoliday): string => `
  <div>
    <h2 class="govuk-heading-s">
      ${record.name}
    </h2>
    ${viewBankHolidayDetails(record)}
  </div>
`;

const viewPerson = (record: any): string => `
  <div>
    <h2 class="govuk-heading-s">
      <a class="govuk-link" href="${record.homepage}">${record.name}</a>
    </h2>
    <p class="govuk-body">${record.description}</p>
    ${record.roles && record.roles.length > 0 ? viewPersonRoles(record.roles) : ''}
  </div>
`;


const viewRoleOrgs = (orgs: any[]): string =>
  viewDetails(
    `belongs to ${orgs.length} ${orgs.length === 1 ? 'organisation' : 'organisations'}`,
    orgs.sort(),
    viewMetaLink
  );


const viewRole = function(record: any): string {
  const nameHtml = record.homePage ? `
    <a class="govuk-link" href="${record.homepage}">${record.name}</a>
  ` : record.name;
  return `
    <div>
      <h2 class="govuk-heading-s">${nameHtml}</h2>
      ${record.description ? `<p class="govuk-body">${record.description}</p>` : ''}
      ${viewRoleOrgs(record.orgNames)}
      ${viewRolePersons(record.personNames)}
    </div>
  `;
};


const viewOrganisation = (record: Organisation): string => `
  <div>
    <h2 class="govuk-heading-s">
      <a class="govuk-link" href="${record.homepage}">${record.name}</a>
    </h2>
    <p class="govuk-body">
      ${record.parentName ? `part of ${viewMetaLink(record.parentName)}` : ''}
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


const viewTransaction = (record: Transaction): string =>
  `<div>
     <h2 class="govuk-heading-s">
       <a class="govuk-link" href="${record.homepage}">${record.name}</a>
     </h2>
     ${record.description ? `<p class="govuk-body">${record.description}</p>` : ''}
   </div>
  `;


const viewTaxon = (record: Taxon): string =>
  `<div>
     ${viewTaxonAncestors(record.ancestorTaxons)}
     <h2 class="govuk-heading-s">
       <a class="govuk-link" href="${record.homepage}">${record.name}</a>
     </h2>
     ${record.description ? `<p class="govuk-body">${record.description}</p>` : ''}
     ${record.childTaxons?.length ? viewTaxonChildren(record.childTaxons) : ''}
   </div>
  `;


const viewTaxonAncestors = (ancestors: any[]): string =>
  ancestors?.length > 0 ? `
    <div class="govuk-breadcrumbs">
      <ol class="govuk-breadcrumbs__list">
        ${sortedBy(ancestors, 'level').map(taxon => `
        <li class="govuk-breadcrumbs__list-item">
          ${viewMetaLink(taxon.name, 'govuk-breadcrumbs__link')}
        </li>
        `).join('')}
      </ol>
    </div>
  ` : '';


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
  return deepCopy.sort((a: any, b: any) => a[field] < b[field] ? -1 : 1);
}


export {
  viewPerson,
  viewOrganisation,
  viewBankHoliday,
  viewTaxon,
  viewRole,
  viewTransaction
};
