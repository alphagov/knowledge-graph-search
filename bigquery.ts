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
  const bqLocalesPromise = bigQuery(`
    SELECT DISTINCT locale
    FROM \`govuk-knowledge-graph.content.locale\`
    ORDER BY locale
  `);
  const bqTaxonsPromise = bigQuery(`
    SELECT DISTINCT taxon_title
    FROM \`govuk-knowledge-graph.content.taxon_search\`
    ORDER BY taxon_title
  `);

  const bqResults = await Promise.all([bqLocalesPromise, bqTaxonsPromise]);

  // maybe we need to handle exceptions here rather than leave it to the
  // caller.
  // Expected bqResults:
  //
  // [
  //  [
  //    { locale: 'ar' }, { locale: 'az' },     { locale: 'be' },
  //    { locale: 'bg' }, { locale: 'bn' },     { locale: 'cs' },
  //    ...
  //  ],
  //  [
  //    { taxon_title: 'https://www.gov.uk/brexit/business-guidance' },
  //    { taxon_title: 'https://www.gov.uk/brexit/guidance-individuals' },
  //    { taxon_title: 'https://www.gov.uk/business-and-industry/alcohol-sales' },
  //    ...
  //  ]
  // ]

  const locales = ['', 'en', 'cy'].concat(
    bqResults[0]
      .map((row: any) => row.locale)
      .filter((locale: string) => locale !== 'en' && locale !== 'cy')
  );
  const taxons = bqResults[1].map((taxon: any) => taxon.taxon_title);

  return { locales, taxons };
};


/*
const getTaxonInfo: GetTaxonInfoSignature = async function(name) {
  const taxonInfoPromise = bigQuery(`
    -- This is more annoying than it needs to be, because the
    -- taxon_levels table uses the homepage_url, not the taxon
    -- url that we defined, and we couldn't work out how to
    -- fix it in MongoDB.

    -- Searched-for taxon
    SELECT
      taxon.title,
      has_homepage.homepage_url,
      taxon_levels.level
    FROM graph.taxon
    INNER JOIN graph.has_homepage ON has_homepage.url = taxon.url
    INNER JOIN content.taxon_levels ON (taxon_levels.url = has_homepage.homepage_url)
    WHERE taxon.title = 'Land Registration Data'
    ;
 `);

  const ancestorsInfoPromise = bigQuery(`
    SELECT
      taxon_ancestors.ancestor_url,
      taxon_ancestors.ancestor_title,
      taxon_levels.level
    FROM graph.taxon_ancestors
    INNER JOIN graph.has_homepage ON has_homepage.url = taxon_ancestors.ancestor_url
    INNER JOIN content.taxon_levels ON (taxon_levels.url = has_homepage.homepage_url)
    WHERE title = 'Land Registration Data'
    ORDER BY level
    ;
  `);

  const childrenInfoPromise = bigQuery(`
    SELECT
      child.title,
      child_homepage.homepage_url,
      child_level.level
    FROM graph.taxon
    INNER JOIN graph.has_homepage AS parent_homepage USING (url)
    INNER JOIN graph.taxon_ancestors AS child ON (child.ancestor_title = taxon.title)
    INNER JOIN graph.has_homepage AS child_homepage ON child_homepage.url = child.url
    INNER JOIN content.taxon_levels AS parent_level ON (parent_level.url = parent_homepage.homepage_url)
    INNER JOIN content.taxon_levels AS child_level ON (child_level.url = child_homepage.homepage_url)
    WHERE taxon.title = 'Land registration'
    AND child_level.level = parent_level.level + 1
    ;
  `);

  const bqResults = await Promise.all([
    taxonInfoPromise,
    ancestorsInfoPromise,
    childrenInfoPromise
  ]);

// expected output
// [
//   [ // results of taxonInfo
//     {
//       taxon.title: ...,
//       has_homepage.homepage_url: ...,
//       taxon_levels.level: ...
//     },
//     { ... }
//   ],
//   [ // results of ancestorsInfo
//     {
//       taxon_ancestors.ancestor_url: ...
//       taxon_ancestors.ancestor_title: ...
//       taxon_levels.level: ...
//     },
//     { ... }
//   ],
//   [ // results of childrenInfo
//     {
//       child.title: ...,
//       child_homepage.homepage_url: ...,
//       child_level.level: ...
//     },
//     { ... }
//   ]
// ]






  const result: Taxon = {

        type: string,
        name: string,
        homepage: string,
        description: string,
        level:
        ancestorTaxons: {
          url: string,
          name: string,
          level:
        }[],
        childTaxons: {
          url: string,
          name: string,
          level:
        }[]

  };

return result;


};
*/

export { sendInitQuery };
//export { sendInitQuery, getTaxonInfo };
