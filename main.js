/* global neo4j, makeViz */

const id = x => document.getElementById(x);
//const status = message => id('status').innerText = message;
//let log = "";
const status = function(message) {
//  log = log + '&#13;&#10;' + message;

//  id('log').innerHTML = log;
  id('status').innerText = message;
};


let neo4jSession;

const buildQuery = function(keywords, excludedKeywords, mode) {
  const inclusionClause = 'WHERE\n' +
    keywords.map(word => `n.title =~ '(?i).*\\\\b${word}\\\\b.*'`).join(`\n ${mode} `);
  const exclusionClause = excludedKeywords.length ?
    ('WITH * WHERE NOT ' + excludedKeywords.map(word => `n.title =~ '(?i).*\\\\b${word}\\\\b.*'`).join(`\n $OR `)) : '';

  return `MATCH
(n:Cid)-[r:HAS_PRIMARY_PUBLISHING_ORGANISATION]->(o:Organisation)
MATCH
(n:Cid)-[:HAS_ORGANISATIONS]->(o2:Organisation)
${inclusionClause}
${exclusionClause}
RETURN
"https://www.gov.uk"+n.name AS url,
n.name AS slug,
n.title,
n.documentType,
n.contentID,
n.publishing_app,
n.first_published_at AS first_published_at,
n.public_updated_at AS last_updated,
COLLECT
(o.name) AS primary_organisation,
COLLECT
(o2.name) AS all_organisations, n.pagerank AS popularity
ORDER BY n.pagerank DESC;`
};


const htmlResults = function(response) {
  const html = ['<table class="govuk-table">'];
  html.push(`<thead class="govuk-table__head">${response.records.length} results</thead><tbody class="govuk-table__body">`);
  html.push(`<tr class="govuk-table__row"><th scope="row" class="govuk-table__header">Title</th>`);
  if (id('show-contentid').checked) html.push('<th scope="row" class="govuk-table__header">ContentID</th>');
  if (id('show-doctype').checked) html.push('<th scope="row" class="govuk-table__header">Type</th>');
  html.push(`</tr>`);

  response.records.forEach(record => {
    let dict = {};
    record.keys.forEach((key, index) => dict[key] = record._fields[index]);

    html.push(`<tr class="govuk-table__row"><td class="govuk-table__cell"><a href="${dict.url}">${dict['n.title']}</a></td>`);
    if (id('show-contentid').checked) html.push(`<td class="govuk-table__cell">${dict['n.contentID']}</td>`);
    if (id('show-doctype').checked) html.push(`<td class="govuk-table__cell">${dict['n.documentType']}</td>`);
    html.push('</th>');
  });

  html.push('</tbody></table>');

  return html.join('');
};


let response;

const searchButtonClicked = async function() {
  const keyword = id('keyword').value;
  const excludedKeyword = id('excluded-keyword').value;

  const mode = id('and-or').selectedIndex == 0 ? 'AND' : 'OR';

  const keywords = keyword.split(/[,;\s]+/).filter(d=>d.length>0).map(s => s.toLowerCase());
  const excludedKeywords = excludedKeyword.split(/[,;\s]+/).filter(d=>d.length>0).map(s => s.toLowerCase());

  if (Math.min(...(keywords.map(word => word.length))) < 3 ||
      Math.min(...(excludedKeywords.map(word => word.length))) < 3) {
    status('Word too short');
    return;
  }



  const query = buildQuery(keywords, excludedKeywords, mode);

  console.log(query);

  response = await (neo4jSession.run(query));

  id('results').innerHTML = htmlResults(response);
  id('show-fields-wrapper').style.display = 'block';
};

const clearButtonClicked = function() {
  id('results').innerHTML = '';
};


(async () => {
  let neo4jDriver;


  const startSession = async function () {
    status('starting session');
    neo4jSession = neo4jDriver.session();
    await makeViz(neo4jSession);
  };


  id('connect-button').addEventListener('click', () => {
    const user = id('user').value;
    const password = id('password').value;
    const uri = id('uri').value;
    neo4jDriver = neo4j.driver(uri, neo4j.auth.basic(user, password));
    status('connected');
    startSession();
  });

  id('keyword-search-button').addEventListener('click', searchButtonClicked);
  id('keyword-clear-button').addEventListener('click', clearButtonClicked);
  id('show-fields').
    addEventListener('click', () => id('results').innerHTML = htmlResults(response));

  // First, look if there's a file with params
  status('Looking for credentials file');
  fetch('params.json')
    .then(async response => {
      const data = await response.json();

      neo4jDriver = neo4j.driver(data.server, neo4j.auth.basic(data.user, data.password));
      status('connected');
      id('uri').value = data.server;
      id('user').value = data.user;
      id('password').value = data.password;
      startSession();

    }).catch(error => {
      console.warn(error);
      status('Enter parameters and click Connect');
    })
})();
