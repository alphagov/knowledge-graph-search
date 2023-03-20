import { Transaction, Taxon, Organisation, Person, Role, MetaResultType, SearchParams, Combinator, SearchResults, InitResults, BankHoliday } from './src/ts/search-api-types';
import { splitKeywords } from './src/ts/utils';
import { languageCode } from './src/ts/lang';
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
    if (options.organisation) {
      params.organisation = options.organisation;
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

const sendInitQuery = async function(): Promise<InitResults> {
  let bqLocales: any, bqTaxons: any, bqOrganisations: any;
  try {
    [ bqLocales, bqTaxons, bqOrganisations ] = await Promise.all([
      bigQuery(`
        SELECT DISTINCT locale
        FROM \`content.locale\`
        `),
      bigQuery(`
        SELECT title
        FROM \`graph.taxon\`
        `),
      bigQuery(`
        SELECT DISTINCT title
        FROM \`graph.organisation\`
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
    taxons: bqTaxons.map((taxon: any) => taxon.title),
    organisations: bqOrganisations.map((organisation: any) => organisation.title)
  };
};


const sendSearchQuery = async function(searchParams: SearchParams): Promise<any> {
  const keywords = splitKeywords(searchParams.selectedWords);
  const excludedKeywords = splitKeywords(searchParams.excludedWords);
  const keywordQuery = buildKeywordQuery(searchParams, keywords, excludedKeywords);
  const linkQuery = buildLinkQuery(searchParams, keywords, excludedKeywords);
  const locale = languageCode(searchParams.selectedLocale);
  const taxon = searchParams.selectedTaxon;
  const organisation = searchParams.selectedOrganisation;
  const selectedWordsWithoutQuotes = searchParams.selectedWords.replace(/"/g, '');

  const keywordsBqParam = { name: selectedWordsWithoutQuotes };
  const queries = [
    bigQuery(keywordQuery, { keywords, excludedKeywords, locale, taxon, organisation }),
    bigQuery(`
      SELECT "Taxon" as type, * FROM search.taxon WHERE CONTAINS_SUBSTR(name, @name);
    `, keywordsBqParam),
    bigQuery(`
      SELECT "Organisation" as type, * FROM search.organisation WHERE CONTAINS_SUBSTR(name, @name);
    `, keywordsBqParam),
    bigQuery(`
      SELECT * FROM search.bank_holiday WHERE CONTAINS_SUBSTR(name, @name);
    `, keywordsBqParam),
    bigQuery(`
      SELECT "Transaction" as type, * FROM search.transaction WHERE CONTAINS_SUBSTR(name, @name);
    `, keywordsBqParam),
    bigQuery(`
      SELECT "Role" as type, * FROM search.role WHERE CONTAINS_SUBSTR(name, @name);
    `, keywordsBqParam),
    bigQuery(`
      SELECT "Person" as type, * FROM search.person WHERE CONTAINS_SUBSTR(name, @name);
    `, keywordsBqParam),
    bigQuery(linkQuery, { keywords, excludedKeywords, locale, taxon, organisation }),
  ];

  const bqResults = await Promise.all(queries);
  const results: SearchResults = {
    keywords: bqResults[0],
    taxons: bqResults[1],
    organisations: bqResults[2],
    bankHolidays: bqResults[3].map((bqBankHoliday: BankHoliday) => {
      return {
        type: MetaResultType.BankHoliday,
        name: bqBankHoliday.name,
        dates: bqBankHoliday.dates.map((date: any) => date.value),
        divisions: bqBankHoliday.divisions
      }
    }),
    transactions: bqResults[4],
    roles: bqResults[5],
    persons: bqResults[6],
    links: bqResults[7]
  };
  return results;
};


const buildKeywordQuery = function(searchParams: SearchParams, keywords: string[], excludedKeywords: string[]): string {

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

  let organisationClause = '';
  if (searchParams.selectedOrganisation !== '') {
    organisationClause = `
      AND EXISTS
        (
          SELECT 1 FROM UNNEST (organisations) AS link
          WHERE link = @organisation
        )
    `;
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
      page_views,
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
    ${organisationClause}
    LIMIT 50000
  `;
};


const buildLinkQuery = function(searchParams: SearchParams, keywords: string[], excludedKeywords: string[]): string {

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
        : `
       EXISTS
         (
           SELECT 1 FROM UNNEST (hyperlinks) AS hyperlink
           WHERE contains_substr(hyperlink, @keyword${index})
         )
       `)
      .join(searchParams.combinator === Combinator.Any ? ' OR ' : ' AND ')) + ')';

  const excludeClause = excludedKeywords.length === 0
    ? ''
    : 'AND NOT (' + ([...Array(excludedKeywords.length).keys()]
      .map(index => searchParams.caseSensitive
        ? `STRPOS(${contentToSearchString}, @excluded_keyword${index}) <> 0`
        : `
      EXISTS
        (
          SELECT 1 FROM UNNEST (hyperlinks) AS hyperlink
          WHERE contains_substr(hyperlink, @excluded_keyword${index})
        )
      `)
      .join(' OR ')) + ')';


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

  let organisationClause = '';
  if (searchParams.selectedOrganisation !== '') {
    organisationClause = `
      AND EXISTS
        (
          SELECT 1 FROM UNNEST (organisations) AS link
          WHERE link = @organisation
        )
    `;
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
      page_views,
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
    ${organisationClause}
    ORDER BY page_views DESC
    LIMIT 10000
  `;
};



export {
  sendInitQuery,
  sendSearchQuery
};
