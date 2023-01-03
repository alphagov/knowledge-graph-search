import axios from 'axios';
import { MainResult, MetaResult, Person, Organisation, Role, Taxon, BankHoliday } from './src/ts/search-api-types';
import { splitKeywords } from './src/ts/utils';
import { languageCode } from './src/ts/lang';
import { GetBankHolidayInfoSignature, GetOrganisationInfoSignature, GetPersonInfoSignature, GetRoleInfoSignature, GetTaxonInfoSignature, SendInitQuerySignature, SendSearchQuerySignature } from './db-api-types';
const { BigQuery } = require('@google-cloud/bigquery');

const bigquery = new BigQuery({
  projectId: 'govuk-knowledge-graph'
});

const bigQuery = async function(userQuery: string) {
  const options = {
    query: userQuery,
    // Location must match that of the dataset(s) referenced in the query.
    location: 'europe-west2',
  };
  // Run the query as a job
  const [job] = await bigquery.createQueryJob(options);
  console.log(`Job ${job.id} started.`);

  // Wait for the query to finish
  const [rows] = await job.getQueryResults();

  return rows;
};


const sendInitQuery: SendInitQuerySignature = async function() {
  const bqLocales = await bigQuery('SELECT DISTINCT locale FROM `govuk-knowledge-graph.content.locale` ORDER BY locale');
  const bqTaxons = await bigQuery('SELECT DISTINCT taxon_title FROM `govuk-knowledge-graph.content.taxon_search` ORDER BY taxon_title');

  const locales = ['', 'en', 'cy'].concat(
    bqLocales
      .map((row: any) => row.locale)
      .filter((locale: string) => locale !== 'en' && locale !== 'cy')
  );

  const result = {
    taxons: bqTaxons.map((taxon: any) => taxon.taxon_title),
    locales
  }
  return result;
};

export { sendInitQuery };
