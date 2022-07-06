import { state } from '../state.js';


const viewMetaStatementList = function(records, edgeTypeCode, edgeTypeName, targetIndex, targetField) {
  const statementsOfInterest = records.filter(record => record._fields[0] && record._fields[1] && record._fields[2] && record._fields[1].type == edgeTypeCode);
  let statementsHtml = '';
  if (statementsOfInterest.length > 0) {
    const statementListItems = statementsOfInterest
      .map(statement => `<li>${statement._fields[targetIndex].properties[targetField]}</li>`)
      .join('');
    statementsHtml = `<p>${edgeTypeName}:</p><ul>${statementListItems}</ul>`;
  }
  return statementsHtml;
}


const viewMetaResults = function() {
  const records = state.metaSearchResults;
  const nodeType = records[0]._fields[0].labels[0];
  if (nodeType === 'BankHoliday') {
    const name = records[0]._fields[0].properties.name;
    return `
      <div class="meta-results-panel">
        <h1>${name} <span class="node-type">(bank holiday)</span></h1>
        ${viewMetaStatementList(records, 'IS_ON', 'On', 2, 'dateString')}
        ${viewMetaStatementList(records, 'IS_OBSERVED_IN', 'Observed in', 2, 'name')}
      </div>
  `;
  } else if (nodeType === 'Person') {
    const personName = records[0]._fields[0].properties.name;
    const personUrl = records[0]._fields[0].properties.basePath;
    const rolesHtml = records
      .filter(record => record._fields[1].type == "HAS_ROLE")
      .map(record => {
        const roleName = record._fields[2].properties.name;
        const orgName = record._fields[4].properties.name;
        const startDate = `${record._fields[1].properties.startDate.day.low}/${record._fields[1].properties.startDate.month.low}/${record._fields[1].properties.startDate.year.low}`
        let endDate = null;
        if (record._fields[1].properties.endDate) {
          endDate = `${record._fields[1].properties.endDate.day.low}/${record._fields[1].properties.endDate.month.low}/${record._fields[1].properties.endDate.year.low}`
        }
        const dates = endDate ? `${startDate}-${endDate}` : `since ${startDate}`;
        return `<li class="">${roleName}, ${orgName} (${dates})</li>`;
      })
      .join('');
    return `
      <div class="meta-results-panel">
        <h1 class="govuk-heading-m"><a class="govuk-link" href="https://www.gov.uk${personUrl}">${personName}</a></h1>
        <p class="govuk-body govuk-!-font-size-16">Roles:</p>
        <ul class="govuk-list govuk-list--bullet govuk-!-font-size-16">${rolesHtml}</ul>
      </div>
    `;
  } else if (nodeType === 'Organisation') {
    const statements = viewMetaStatementList(records, 'HAS_CHILD', 'Includes', 2, 'name');
    return `
      <div class="meta-results-panel">
        <h1>${state.selectedWords} <span class="node-type">(organisation)</span></h1>
        ${statements.length > 0 ? statements : '<p class="govuk-body">No sub-organisations</p>'}
      </div>
    `;
  }
};

export { viewMetaResults };
