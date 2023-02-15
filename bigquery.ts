import { Transaction, MetaResultType, SearchParams, Combinator, SearchResults } from './src/ts/search-api-types';
import { splitKeywords } from './src/ts/utils';
import { languageCode } from './src/ts/lang';
import { GetBankHolidayInfoSignature, GetTransactionInfoSignature, GetOrganisationInfoSignature, GetPersonInfoSignature, GetRoleInfoSignature, GetTaxonInfoSignature, SendInitQuerySignature, SendSearchQuerySignature } from './db-api-types';
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
  const bqTaxon = await bigQuery(
    `SELECT * FROM search.taxon WHERE lower(name) = lower(@name);`, { name }
  );

  return {
    type: MetaResultType.Taxon,
    name: bqTaxon[0].name,
    homepage: bqTaxon[0].homepage,
    description: bqTaxon[0].description,
    level: parseInt(bqTaxon[0].level),
    ancestorTaxons: bqTaxon[0].ancestorTaxons,
    childTaxons: bqTaxon[0].childTaxons
  };
};


const getOrganisationInfo: GetOrganisationInfoSignature = async function(name) {
  const bqOrganisation = await bigQuery(
    `SELECT * FROM search.organisation WHERE lower(name) = lower(@name);`, { name }
  );

  return {
    type: MetaResultType.Organisation,
    name: bqOrganisation[0].name,
    description: bqOrganisation[0].description,
    homepage: bqOrganisation[0].homepage,
    parentName: bqOrganisation[0].parentName,
    childOrgNames: bqOrganisation[0].childOrgNames,
    personRoleNames: bqOrganisation[0].personRoleNames,
    supersededBy: bqOrganisation[0].supersededBy,
    supersedes: bqOrganisation[0].supersedes
  };
};


const getBankHolidayInfo: GetBankHolidayInfoSignature = async function(name) {
  const bqBankHoliday = await bigQuery(
    `SELECT * FROM search.bank_holiday WHERE lower(name) = lower(@name);`, { name }
  );

  return {
    type: MetaResultType.BankHoliday,
    name: bqBankHoliday[0].name,
    dates: bqBankHoliday[0].dates.map((date: any) => date.value),
    regions: bqBankHoliday[0].divisions
  };
};

const getTransactionInfo: GetTransactionInfoSignature = async function(name) {
  const bqTransaction = await bigQuery(
    `SELECT * FROM search.transaction WHERE lower(name) = lower(@name);`, { name }
  );

  const result:Transaction = {
    type: MetaResultType.Transaction,
    name: bqTransaction[0].name,
    homepage: bqTransaction[0].homepage,
    description: bqTransaction[0].description
  };
  return result;
};

const getRoleInfo: GetRoleInfoSignature = async function(name) {
  const bqRole = await bigQuery(
    `SELECT * FROM search.role WHERE lower(name) = lower(@name);`, { name }
  );

  return {
    type: MetaResultType.Role,
    name: bqRole[0].name,
    description: bqRole[0].description,
    personNames: bqRole[0].personNames,
    orgNames: bqRole[0].orgNames
  };
};

const getPersonInfo: GetPersonInfoSignature = async function(name) {
  const bqPerson = await bigQuery(
      `SELECT * FROM search.person WHERE lower(name) = lower(@name);`, { name }
    )
  ;

  return {
    type: MetaResultType.Person,
    name: bqPerson[0].name,
    homepage: bqPerson[0].name,
    description: bqPerson[0].name,
    roles: bqPerson[0].roles
  }
};

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
    `SELECT *
     FROM search.thing
     WHERE CONTAINS_SUBSTR(name, @selected_words_without_quotes)
     ;`
    , { selectedWordsWithoutQuotes }))
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
          SELECT 1 FROM UNNEST (taxons) AS taxon
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
      documentType,
      contentId,
      locale,
      publishing_app,
      first_published_at,
      public_updated_at,
      withdrawn_at,
      withdrawn_explanation,
      pagerank,
      taxons,
      primary_organisation,
      organisations AS all_organisations
    FROM search.page

    WHERE TRUE
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
  getPersonInfo,
  getRoleInfo,
  getTaxonInfo,
  sendInitQuery,
  sendSearchQuery
};
