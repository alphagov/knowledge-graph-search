import { state } from '../state.js';


const viewOrgSubOrg = function(subOrg) {
  return `<li><a href="${subOrg.url}">${subOrg.name}</a></li>`;
};

const viewOrgSubOrgs = function(subOrgList) {
  return `
    <details class="govuk-details" data-module="govuk-details">
      <summary class="govuk-details__summary">
        <span class="govuk-details__summary-text">
          Sub organisations
        </span>
      </summary>
      <div class="govuk-details__text">
        <ul class="govuk-list">${subOrgList.map(viewOrgSubOrg).join('')}</ul>
      </div>
    </details>`;
};

const viewPersonRoles = function(roles) {
  return `
    <details class="govuk-details" data-module="govuk-details">
      <summary class="govuk-details__summary">
        <span class="govuk-details__summary-text">
          Roles
        </span>
      </summary>
      <div class="govuk-details__text">
        <ul class="govuk-list">${roles.map(role => `<li>${role.name} as <a href="${role.orgUrl}">${role.orgName}</a></li>`).join('')}</ul>
      </div>
    </details>`;
}

const viewBankHolidayDetails = function(holiday) {
  return `
    <details class="govuk-details" data-module="govuk-details">
      <summary class="govuk-details__summary">
        <span class="govuk-details__summary-text">
          Dates
        </span>
      </summary>
      <div class="govuk-details__text">
        <ul class="govuk-list">
          ${holiday.dates.map(dateString => `<li>${dateString}</li>`).join('')}
        </ul>
      </div>
    </details>
    <details class="govuk-details" data-module="govuk-details">
      <summary class="govuk-details__summary">
        <span class="govuk-details__summary-text">
          Observed in
        </span>
      </summary>
      <div class="govuk-details__text">
        <ul class="govuk-list">
          ${holiday.regions.map(region => `<li>${region}</li>`).join('')}
        </ul>
      </div>
    </details>
  `;
};

const viewMetaResults = function() {
  const record = state.metaSearchResults[0];

  if (record.type === 'BankHoliday') {
    return `
      <div class="meta-results-panel">
        <h1>${record.name}</h1>
        ${viewBankHolidayDetails(record)}
      </div>
  `;
  } else if (record.type === 'Person') {
    const personName = record.name;
    const personUrl = record.basePath;
    return `
      <div class="meta-results-panel">
        <h1 class="govuk-heading-m"><a class="govuk-link" href="https://www.gov.uk${personUrl}">${personName}</a></h1>
        ${record.roles && record.roles.length > 0 ? viewPersonRoles(record.roles) : ''}
      </div>
    `;
  } else if (record.type === 'Organisation') {
    const orgName = record.name;
    return `
      <div class="meta-results-panel">
        <h1>${orgName}</h1>
        ${record.subOrgs && record.subOrgs.length > 0 ? viewOrgSubOrgs(record.subOrgs) : '<p class="govuk-body">No sub-organisations</p>'}
      </div>
    `;
  }
};

export { viewMetaResults };
