import axios from 'axios';
import { MainResult, MetaResult, Person, Organisation, Role, Taxon, BankHoliday, MetaResultType } from './src/ts/search-api-types';
import { splitKeywords } from './src/ts/utils';
import { languageCode } from './src/ts/lang';
import { GetBankHolidayInfoSignature, GetOrganisationInfoSignature, GetPersonInfoSignature, GetRoleInfoSignature, GetTaxonInfoSignature, SendInitQuerySignature, SendSearchQuerySignature } from './db-api-types';
const { BigQuery } = require('@google-cloud/bigquery');

//====== private ======

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

//====== public ======

const sendInitQuery: SendInitQuerySignature = async function() {
  const [ bqLocales, bqTaxons ] = await Promise.all([
    bigQuery(`
      SELECT DISTINCT locale
      FROM \`govuk-knowledge-graph.content.locale\`
      ORDER BY locale
    `),
    bigQuery(`
      SELECT DISTINCT taxon_title
      FROM \`govuk-knowledge-graph.content.taxon_search\`
      ORDER BY taxon_title
    `)]);

  return {
    locales: ['', 'en', 'cy'].concat(
      bqLocales
        .map((row: any) => row.locale)
        .filter((locale: string) => locale !== 'en' && locale !== 'cy')
      ),
    taxons: bqTaxons.map((taxon: any) => taxon.taxon_title)
  };
};

/*
const getTaxonInfo: GetTaxonInfoSignature = async function(name) {
  const [ bqTaxon, bqAncestors, bqChildren] = await Promise.all([
    bigQuery(`
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
    `),
    bigQuery(`
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
   `),
    bigQuery(`
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
    `)
  ]);

  return {
    type: MetaResultType.Taxon,
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
  }
};


const getOrganisationInfo: GetOrganisationInfoSignature = async function(name) {
  const [ bqOrganisation, bqParent, bqChildren, bqPersonRole ] = await Promise.all([
    bigQuery(`
      SELECT url, title, description, homepage_url
      FROM graph.organisation
      WHERE title = ${name}
      ;
   `),
    bigQuery(`
      SELECT parent.title
      FROM graph.organisation
      INNER JOIN graph.has_parent USING (url)
      INNER JOIN graph.organisation AS parent ON has_parent.parent_url = parent.url
      WHERE organisation.title = ${name}
      ;
    `),
    bigQuery(`
      SELECT child.title
      FROM graph.organisation AS parent
      INNER JOIN graph.has_parent ON has_parent.parent_url = parent.url
      INNER JOIN graph.organisation AS child ON child.url = has_parent.url
      WHERE parent.title = ${name}
      ;
    `),
    bigQuery(`
      SELECT person.title AS personName, role.title AS roleName
      FROM graph.organisation AS org
      INNER JOIN graph.belongs_to ON org.url = belongs_to.organisation_url
      INNER JOIN graph.role ON belongs_to.role_url = role.url
      INNER JOIN graph.has_role ON role.url = has_role.role_url
      INNER JOIN graph.person ON has_role.person_url = person.url
      WHERE org.title = ${name}
      AND has_role.ended_on IS NULL
      ;
    `),
    bigQuery(`
      SELECT successor.title
      FROM graph.organisation
      INNER JOIN graph.has_successor USING (url)
      INNER JOIN graph.organisation AS successor ON has_successor.successor_url = successor.url
      WHERE organisation.title = ${name}
      ;
    `),
    bigQuery(`
      SELECT child.title
      FROM graph.organisation AS parent
      INNER JOIN graph.has_parent ON has_parent.parent_url = parent.url
      INNER JOIN graph.organisation AS child ON child.url = has_parent.url
      WHERE parent.title = ${name}
      ;
    `),
]);

  return {
    type: MetaResultType.Organisation,
    name: bqOrganisation.title,
    description: bqOrganisation.description,
    homepage: bqOrganisation.homepage_url,
    parentName: bqParent['parent.title'],
    childOrgNames: bqChildren.map(child => child['child.title']),
    personRoleNames: bqPersonRole,


//   supersededBy: string[],
//   supersedes: string[]
  };
};


const getBankHolidayInfo: GetBankHolidayInfoSignature = async function(name) {
  const bqBankHoliday = await bigQuery(`
    ...
  `);

  return {
    type: MetaResultType.BankHoliday,
//   name: string,
//   dates: string[],
//   regions: string[]
  };
};


const getRoleInfo: GetRoleInfoSignature = async function(name) {
  const [ bqRole, bqPersons ] = await Promise.all([
    bigQuery(`
      ...
    `),
    bigQuery(`
      ...
    `)]);

  return {
    type: MetaResultType.Role,
    name: string,
    description: string,
    personNames: {
      name: string,
      homepage: string,
      startDate: Date,
      endDate: Date | null
    }[],
    orgNames: string[]
  };
};


const getPersonInfo: GetPersonInfoSignature = async function(name) {
  const [ bqPerson, bqRoles ] = await Promise.all([
    bigQuery(`
      ...
    `),
    bigQuery(`
      ...
    `)
  ]);

  return {
    type: MetaResultType.Person,
    name: string,
    homepage: string,
    description: string,
    roles: {
      title: string,
      orgName: string,
      orgUrl: string,
      startDate: Date,
      endDate: Date | null
    }[]
  }
};


const sendSearchQuery: SendSearchQuerySignature = async function(searchParams) {
  const [ bqMainResults, bqMetaResults ] = await Promise.all([
    bigQuery(`
      ... // keyword search
    `),
    bigQuery(`
      ... // meta query
    `)
  ]);

  return {
    mainResults: MainResult[],
    metaResults: MetaResult[]
  }

};




export { sendSearchQuery, sendInitQuery, getTaxonInfo, getOrganisationInfo, getRoleInfo, getPersonInfo, getBankHolidayInfo };
*/

export { sendInitQuery };
