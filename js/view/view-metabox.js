import { state } from '../state.js';


const viewMetaStatementList = function(records, edgeTypeCode, edgeTypeName, targetIndex, targetField) {
  const statementsOfInterest = records.filter(record => record._fields[1].type == edgeTypeCode);
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
    return `
      <div class="meta-results-panel">
        <h1>${state.selectedWords} <span class="node-type">(bank holiday)</span></h1>
        ${viewMetaStatementList(records, 'IS_ON', 'On', 2, 'dateString')}
        ${viewMetaStatementList(records, 'IS_OBSERVED_IN', 'Observed in', 2, 'name')}
      </div>
  `;
  } else if (nodeType === 'Person') {
    const rolesHtml = records
      .filter(record => record._fields[1].type == "HAS_ROLE")
      .map(record => {
        const roleName = record._fields[2].properties.name;
        const orgName = record._fields[4].properties.name;
        return `<li>${roleName}, <a href="#">${orgName}</a></li>`;
      })
      .join('');
    return `
      <div class="meta-results-panel">
        <h1>${state.selectedWords} <span class="node-type">(person)</span></h1>
        <p>Roles:</p>
        <ul>${rolesHtml}</ul>
      </div>
    `;
  } else if (nodeType === 'Organisation') {
    return `
      <div class="meta-results-panel">
        <h1>${state.selectedWords} <span class="node-type">(organisation)</span></h1>
        ${viewMetaStatementList(records, 'HAS_SUPERSEDED', 'Supersedes', 2, 'name')}
        ${viewMetaStatementList(records, 'HAS_CHILD', 'Includes', 2, 'name')}
      </div>
    `;
  }
};

export { viewMetaResults };
