import { Transaction, MetaResultType, SearchParams, Combinator, SearchResults } from './src/ts/search-api-types';
import { splitKeywords } from './src/ts/utils';
import { languageCode } from './src/ts/lang';
import { GetBankHolidayInfoSignature, GetTransactionInfoSignature, GetOrganisationInfoSignature, GetTaxonInfoSignature, SendInitQuerySignature, SendSearchQuerySignature } from './db-api-types';
const { BigQuery } = require('@google-cloud/bigquery');

//====== private ======

const internalLinkRegExp = /^((https:\/\/)?((www\.)?gov\.uk))?\//;


const bigquery = new BigQuery({
  projectId: process.env.PROJECT_ID
});


const bigQuery = async function(userQuery: string, options?: any) {
  const params: Record<string, string> = {};

  if (options) {
    if (options.keywords) {
      options.keywords.forEach((keyword: string, index: number) =>
        params[`keyword${index}`] = keyword
      );
    }
    if (options.excludedKeywords) {
      options.excludedKeywords.forEach((keyword: string, index: number) =>
        params[`excluded_keyword${index}`] = keyword);
    }
    if (options.name) {
      params.name = options.name;
    }
    if (options.locale) {
      params.locale = options.locale;
    }
    if (options.taxon) {
      params.taxon = options.taxon;
    }
    if (options.link) {
      params.link = options.link;
    }
    if (options.selectedWordsWithoutQuotes !== undefined) {
      params.selected_words_without_quotes = options.selectedWordsWithoutQuotes;
    }
  }

  const bqOptions = {
    query: userQuery,
    location: 'europe-west2',
    params
  };

  const [rows] = await bigquery.query(bqOptions);

  return rows;
};

//====== public ======

const sendInitQuery: SendInitQuerySignature = async function() {
  let bqLocales: any, bqTaxons: any;
  try {
    [ bqLocales, bqTaxons ] = await Promise.all([
      bigQuery(`
        SELECT DISTINCT locale
        FROM \`content.locale\`
        `),
      bigQuery(`
        SELECT title
        FROM \`graph.taxon\`
        `)
    ]);
  } catch(e) {
    console.log('sendInitQueryError', e);
  }

  return {
    locales: ['', 'en', 'cy'].concat(
      bqLocales
        .map((row: any) => row.locale)
        .filter((locale: string) => locale !== 'en' && locale !== 'cy')
      ),
    taxons: bqTaxons.map((taxon: any) => taxon.title)
  };
};

const getTaxonInfo: GetTaxonInfoSignature = async function(name) {
  const [ bqTaxon, bqAncestors, bqChildren ] = await Promise.all([
    bigQuery(`
      SELECT
        title,
        taxon.level AS level,
        taxon_levels.homepage_url AS homepage,
        description.description
      FROM graph.taxon
      INNER JOIN content.taxon_levels ON taxon_levels.url = taxon.url
      LEFT JOIN content.description ON description.url = taxon_levels.homepage_url
      WHERE taxon.title = @name
      ;
    `, { name }),
    bigQuery(`
      SELECT
        taxon_ancestors.ancestor_title AS name,
        taxon_levels.level AS level,
        taxon_levels.homepage_url AS url
      FROM graph.taxon_ancestors
      INNER JOIN content.taxon_levels ON taxon_levels.url = taxon_ancestors.ancestor_url
      WHERE title = @name
      ;
   `, { name }),
    bigQuery(`
      SELECT
        child.title AS name,
        taxon_levels.homepage_url AS url,
        taxon_levels.level AS level
      FROM graph.taxon AS parent
      INNER JOIN graph.has_parent ON has_parent.parent_url = parent.url
      INNER JOIN graph.taxon AS child ON child.url = has_parent.url
      INNER JOIN content.taxon_levels ON taxon_levels.url = child.url
      WHERE parent.title = @name
      ;
    `, { name })
  ]);

  return {
    type: MetaResultType.Taxon,
    name: bqTaxon[0].title,
    homepage: bqTaxon[0].homepage,
    description: bqTaxon[0].description,
    level: parseInt(bqTaxon[0].level),
    ancestorTaxons: bqAncestors,
    childTaxons: bqChildren
  };
};


const getOrganisationInfo: GetOrganisationInfoSignature = async function(name) {
  const [ bqOrganisation, bqParent, bqChildren, bqPersonRole, bqSuccessor, bqPredecessor ] = await Promise.all([
    bigQuery(`
      SELECT
        page.url AS homepage,
        page.description AS description,
      FROM graph.organisation AS org
      INNER JOIN graph.has_homepage AS hh on hh.url = org.url
      INNER JOIN graph.page on hh.homepage_url = page.url
      WHERE org.title = @name
      ;
   `, { name }),
    bigQuery(`
      SELECT parent.title AS parent
      FROM graph.organisation
      INNER JOIN graph.has_parent USING (url)
      INNER JOIN graph.organisation AS parent ON has_parent.parent_url = parent.url
      WHERE organisation.title = @name
      ;
    `, { name }),
    bigQuery(`
      SELECT child.title
      FROM graph.organisation AS parent
      INNER JOIN graph.has_parent ON has_parent.parent_url = parent.url
      INNER JOIN graph.organisation AS child ON child.url = has_parent.url
      WHERE parent.title = @name
      ;
    `, { name }),
    bigQuery(`
      SELECT person.title AS personName, role.title AS roleName
      FROM graph.organisation AS org
      INNER JOIN graph.belongs_to ON org.url = belongs_to.organisation_url
      INNER JOIN graph.role ON belongs_to.role_url = role.url
      INNER JOIN graph.has_role ON role.url = has_role.role_url
      INNER JOIN graph.person ON has_role.person_url = person.url
      WHERE org.title = @name
      AND has_role.ended_on IS NULL
      ;
    `, { name }),
    bigQuery(`
      SELECT successor.title AS title
      FROM graph.organisation
      INNER JOIN graph.has_successor USING (url)
      INNER JOIN graph.organisation AS successor ON has_successor.successor_url = successor.url
      WHERE organisation.title = @name
      ;
    `, { name }),
    bigQuery(`
      SELECT organisation.title
      FROM graph.organisation
      INNER JOIN graph.has_successor USING (url)
      INNER JOIN graph.organisation AS successor ON has_successor.successor_url = successor.url
      WHERE successor.title = @name
    `, { name })
  ]);

  return {
    type: MetaResultType.Organisation,
    name,
    description: bqOrganisation[0].description,
    homepage: bqOrganisation[0].homepage,
    parentName: bqParent.title,
    childOrgNames: bqChildren.map((child: any) => child.title),
    personRoleNames: bqPersonRole,
    supersededBy: bqSuccessor.map((successor: any) => successor.title),
    supersedes: bqPredecessor.map((predecessor: any) => predecessor.title)
  };
};


const getBankHolidayInfo: GetBankHolidayInfoSignature = async function(name) {
  const bqBankHoliday = await bigQuery(`
    SELECT
      title AS name,
      ARRAY_AGG(DISTINCT division) AS divisions,
      ARRAY_AGG(DISTINCT date) AS dates
    FROM \`content.bank_holiday\`
    WHERE title = @name
    GROUP BY title
  `, { name });

  return {
    type: MetaResultType.BankHoliday,
    name: bqBankHoliday[0].name,
    dates: bqBankHoliday[0].dates.map((date: any) => date.value),
    regions: bqBankHoliday[0].divisions
  };
};

const getTransactionInfo: GetTransactionInfoSignature = async function(name) {
  const bqTransaction = await bigQuery(`
    SELECT
      url AS homepage,
      title AS name,
      description
    FROM \`graph.page\`
    WHERE title = @name
  `, { name });

  const result:Transaction = {
    type: MetaResultType.Transaction,
    homepage: bqTransaction[0].homepage,
    name: bqTransaction[0].name,
    description: bqTransaction[0].description
  };
  return result;
};


/*
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
*/



const sendSearchQuery: SendSearchQuerySignature = async function(searchParams) {
  const keywords = splitKeywords(searchParams.selectedWords);
  const excludedKeywords = splitKeywords(searchParams.excludedWords);
  const query = buildSqlQuery(searchParams, keywords, excludedKeywords);
  const locale = languageCode(searchParams.selectedLocale);
  const taxon = searchParams.selectedTaxon;
  const selectedWordsWithoutQuotes = searchParams.selectedWords.replace(/"/g, '');
  const link = searchParams.linkSearchUrl && internalLinkRegExp.test(searchParams.linkSearchUrl)
    ? searchParams.linkSearchUrl.replace(internalLinkRegExp, 'https://www.gov.uk/')
    : searchParams.linkSearchUrl;
  const queries = [
    bigQuery(query, { keywords, excludedKeywords, locale, taxon, link })
  ];
  console.log(111, query)
  console.log(112, { keywords, excludedKeywords, locale, taxon, link })
  if (selectedWordsWithoutQuotes &&
    selectedWordsWithoutQuotes.length > 5 &&
    selectedWordsWithoutQuotes.includes(' ')) {
    queries.push(bigQuery(
`      WITH things AS (
--        SELECT 'Person' AS type, url, title AS name
--        FROM graph.person
--        UNION ALL
        SELECT 'Organisation' AS type, url, title AS name
        FROM graph.organisation
        UNION ALL
--        SELECT 'Role' AS type, url, title AS name
--        FROM graph.role
--        UNION ALL
        SELECT 'BankHoliday' AS type, url, title AS name
        FROM graph.bank_holiday_title
        UNION ALL
        SELECT 'Taxon' AS type, url, title AS name
        FROM graph.taxon
        UNION ALL
        SELECT 'Transaction' AS type, url, title AS name
        FROM graph.page
        WHERE document_type = 'transaction'
      )
      SELECT type, url, name from things
      WHERE CONTAINS_SUBSTR(name, @selected_words_without_quotes)
    `, { selectedWordsWithoutQuotes }))
  }


  const results = await Promise.all(queries);

  const bqMainResults = results[0];
  const bqMetaResults = results.length > 1 ? results[1] : [];

  const result:SearchResults = {
    main: bqMainResults,
    meta: bqMetaResults
  }

  return result;

};


const buildSqlQuery = function(searchParams: SearchParams, keywords: string[], excludedKeywords: string[]): string {

  const contentToSearch = [];
  if (searchParams.whereToSearch.title) {
    contentToSearch.push('IFNULL(page.title, "")');
  }
  if (searchParams.whereToSearch.text) {
    contentToSearch.push('IFNULL(page.text, "")', 'IFNULL(page.description, "")');
  }
  const contentToSearchString = contentToSearch.join(' || " " || ');

  const includeClause = keywords.length === 0
    ? ''
    : 'AND (' + ([...Array(keywords.length).keys()]
      .map(index => searchParams.caseSensitive
        ? `STRPOS(${contentToSearchString}, @keyword${index}) <> 0`
        : `CONTAINS_SUBSTR(${contentToSearchString}, @keyword${index})`)
      .join(searchParams.combinator === Combinator.Any ? ' OR ' : ' AND ')) + ')';

  const excludeClause = excludedKeywords.length === 0
    ? ''
    : 'AND NOT (' + ([...Array(excludedKeywords.length).keys()]
      .map(index => searchParams.caseSensitive
        ? `STRPOS(${contentToSearchString}, @excluded_keyword${index}) <> 0`
        : `CONTAINS_SUBSTR(${contentToSearchString}, @excluded_keyword${index})`)
      .join(' OR ')) + ')';
;

  let areaClause = '';
  if (searchParams.areaToSearch === 'publisher') {
    areaClause = 'AND publishing_app = "publisher"';
  } else if (searchParams.areaToSearch === 'whitehall') {
    areaClause = 'AND publishing_app = "whitehall"';
  }

  let localeClause = '';
  if (searchParams.selectedLocale !== '') {
    localeClause = `AND locale = @locale`
  }

  let taxonClause = '';
  if (searchParams.selectedTaxon !== '') {
    taxonClause = `
      AND EXISTS
        (
          SELECT 1 FROM UNNEST (taxon_ancestors) AS taxon
          WHERE taxon = @taxon
        )
    `;
  }

  let linkClause = '';
  if (searchParams.linkSearchUrl !== '') {
    if (internalLinkRegExp.test(searchParams.linkSearchUrl)) {
      // internal link search: look for exact match
      linkClause = `
        AND EXISTS
          (
            SELECT 1 FROM UNNEST (hyperlinks) AS link
            WHERE link = @link
          )
      `;
    } else {
      // external link search: look for url as substring
      linkClause = `
        AND EXISTS
          (
            SELECT 1 FROM UNNEST (hyperlinks) AS link
            WHERE CONTAINS_SUBSTR(link, @link)
          )
      `;
    }
  }

  return `
    SELECT
      url,
      title,
      document_type AS documentType,
      content_id AS contentId,
      locale,
      publishing_app,
      first_published_at,
      public_updated_at,
      withdrawn_at,
      withdrawn_explanation,
      pagerank,
      taxon_ancestors AS taxons,
      primary_publishing_organisation AS primary_organisation,
      organisations AS all_organisations
    FROM graph.page

    WHERE TRUE
    AND (page.document_type IS NULL
    OR NOT page.document_type IN ('gone', 'redirect', 'placeholder', 'placeholder_person'))
    ${includeClause}
    ${excludeClause}
    ${areaClause}
    ${localeClause}
    ${taxonClause}
    ${linkClause}

    LIMIT 50000
  `;
};


export {
  getBankHolidayInfo,
  getTransactionInfo,
  getOrganisationInfo,
  getTaxonInfo,
  sendInitQuery,
  sendSearchQuery
};
//export { sendSearchQuery, getTaxonInfo, getOrganisationInfo, getPersonInfo, getBankHolidayInfo, getRoleInfo };
