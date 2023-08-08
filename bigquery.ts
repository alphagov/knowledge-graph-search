import { Transaction, Taxon, Organisation, Person, Role, MetaResultType, MetaResult, MainResult, SearchParams, Combinator, SearchResults, SearchType, InitResults, BankHoliday, WhereToSearch, Sorting, Pages } from './src/ts/search-api-types';
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

    if (options.documentType) {
      params.documentType = options.documentType;
    }
    if (options.link) {
      params.link = options.link;
    }
    if (options.selectedWordsWithoutQuotes !== undefined) {
      params.selected_words_without_quotes = options.selectedWordsWithoutQuotes;
    }
    if (options.pages) {
      params.pages = options.pages;
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
  let bqLocales: any, bqTaxons: any, bqOrganisations: any, bqDocumentTypes: any, bqPublishingApps: any;
  try {
    [ bqLocales, bqTaxons, bqOrganisations, bqDocumentTypes, bqPublishingApps ] = await Promise.all([
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
        `),
      bigQuery(`
        SELECT DISTINCT document_type
        FROM \`content.document_type\`
        `),
      bigQuery(`
        SELECT DISTINCT publishing_app
        FROM \`content.publishing_app\`
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
    organisations: bqOrganisations.map((organisation: any) => organisation.title),
    documentTypes: bqDocumentTypes.map((documentType: any) => documentType.document_type),
    publishingApps: bqPublishingApps.map((publishingApp: any) => publishingApp.publishing_app)
  };
};


const getTaxonInfo = async function(name: string): Promise<Taxon[]> {
  return await bigQuery(
    `SELECT "Taxon" as type, * FROM search.taxon WHERE lower(name) = lower(@name);`, { name }
  );
};


const getOrganisationInfo = async function(name: string): Promise<Organisation[]> {
  return await bigQuery(
    `SELECT "Organisation" as type, * FROM search.organisation WHERE lower(name) = lower(@name);`, { name }
  );
};


const getDocumentTypeInfo = async function(name: string): Promise<any[]> {
  return await bigQuery(
    `SELECT "DocumentType" as type, * FROM search.document_type WHERE lower(name) = lower(@name);`, { name }
  );
};


const getBankHolidayInfo = async function(name: string): Promise<BankHoliday[]> {
  const bqBankHolidays: BankHoliday[] = await bigQuery(
    `SELECT * FROM search.bank_holiday WHERE lower(name) = lower(@name);`, { name }
  );
  return bqBankHolidays.map((bqBankHoliday: BankHoliday) => {
    return {
      type: MetaResultType.BankHoliday,
      name: bqBankHoliday.name,
      dates: bqBankHoliday.dates.map((date: any) => date.value),
      divisions: bqBankHoliday.divisions
    }
  });
};


const getTransactionInfo = async function(name: string): Promise<Transaction[]> {
  return await bigQuery(
    `SELECT "Transaction" as type, * FROM search.transaction WHERE lower(name) = lower(@name);`, { name }
  );
};


const getRoleInfo = async function(name: string): Promise<Role[]> {
  return await bigQuery(
    `SELECT "Role" as type, * FROM search.role WHERE lower(name) = lower(@name);`, { name }
  );
};


const getPersonInfo = async function(name: string): Promise<Person[]> {
  return await bigQuery(
    `SELECT "Person" as type, * FROM search.person WHERE lower(name) = lower(@name);`, { name }
  );
};

//keywords as used here must be exactly the same set of combinedWords as used by the function containDescription.
const sendSearchQuery = async function(searchParams: SearchParams): Promise<SearchResults> {
  const keywords = splitKeywords(searchParams.selectedWords);
  const excludedKeywords = splitKeywords(searchParams.excludedWords);
  const query = buildSqlQuery(searchParams, keywords, excludedKeywords);
  const locale = languageCode(searchParams.selectedLocale);
  const taxon = searchParams.selectedTaxon;
  const organisation = searchParams.selectedOrganisation;
  const documentType = searchParams.selectedDocumentType;
  const selectedWordsWithoutQuotes = searchParams.selectedWords.replace(/"/g, '');
  const link = searchParams.linkSearchUrl;
  const queries = [
    bigQuery(query, { keywords, excludedKeywords, locale, taxon, organisation, link, documentType })
  ];

  let bqMetaResults: MetaResult[] = [];
  let bqMainResults: MainResult[] = [];
  let results: any;

  switch (searchParams.searchType) {
    case SearchType.Taxon:
      results = await Promise.all(queries);
      bqMainResults = results[0];
      bqMetaResults = await getTaxonInfo(searchParams.selectedTaxon);
      break;
    case SearchType.Organisation:
      results = await Promise.all(queries);
      bqMainResults = results[0];
      bqMetaResults = await getOrganisationInfo(searchParams.selectedOrganisation);
      break;
    default:
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
      results = await Promise.all(queries);
      bqMainResults = results[0]
      bqMetaResults = results.length > 1 ? results[1] : [];
      break;
  }
  const result:SearchResults = {
    main: bqMainResults,
    meta: bqMetaResults
  }
  return result;
};


const buildSqlQuery = function(searchParams: SearchParams, keywords: string[], excludedKeywords: string[]): string {
  const contentToSearch = [];

  if (searchParams.whereToSearch === WhereToSearch.Title) {
    contentToSearch.push('IFNULL(page.title, "")');
  }

  if (searchParams.whereToSearch === WhereToSearch.Text) {
    contentToSearch.push('IFNULL(NORMALIZE(page.text, NFKC), "")');
  }

  if (searchParams.whereToSearch === WhereToSearch.Description) {
    contentToSearch.push('IFNULL(NORMALIZE(page.description, NFKC), "")');
  }

  if (searchParams.whereToSearch === WhereToSearch.All) {
    contentToSearch.push('IFNULL(page.title, "")', 'IFNULL(NORMALIZE(page.text, NFKC), "")', 'IFNULL(NORMALIZE(page.description, NFKC), "")');
  }
  const contentToSearchString = contentToSearch.join(' || " " || ');

  const padding = 50;


  const truncatedContent = searchParams.searchType !== SearchType.Link &&
  searchParams.searchType !==  SearchType.Advanced &&
  !searchParams.selectedTaxon &&
  !searchParams.selectedOrganisation &&
  !searchParams.selectedDocumentType &&
  !searchParams.selectedLocale ?  `

    ${
      keywords.map(value =>
        `(
          SELECT RIGHT(
            LEFT(text,(STRPOS(LOWER(NORMALIZE(text, NFKC)), LOWER("${value}")))+ ${padding} + ${value.length}),  ${padding*2} + ${value.length})
          ) as keyword_${value.replace(/ /g, '_')}`
      )
    }
  ,`: '';

  const textOccurrences = searchParams.searchType !== SearchType.Link &&
  searchParams.searchType !==  SearchType.Advanced &&
  !searchParams.selectedTaxon &&
  !searchParams.selectedOrganisation &&
  !searchParams.selectedDocumentType &&
  searchParams.whereToSearch !== 'title' &&
  !searchParams.selectedLocale ?  keywords.length === 1 ? `(
    SELECT
    ARRAY_LENGTH(REGEXP_EXTRACT_ALL(LOWER(${contentToSearchString}), LOWER(r'(${keywords[0]})')))
  ) AS occurrences,` : `
  (
    ${
      keywords.map(value =>
        `(
          SELECT
        ARRAY_LENGTH(REGEXP_EXTRACT_ALL(LOWER(${contentToSearchString}), LOWER(r'(${value})')))
        ) `
      )
    }
  ) AS occurrences,`: '';

  const linkOccurrences = searchParams.searchType === SearchType.Link ? `(
    SELECT
    COUNT(1) FROM UNNEST(hyperlinks) as hyperlink WHERE CONTAINS_SUBSTR(hyperlink.link_url, @link)
  ) AS occurrences,`: '';


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

  let pagesClause = '';
  if (searchParams.pages === Pages.NotWithdrawn) {
    pagesClause = 'WHERE withdrawn_at IS NULL';
  } else if(searchParams.pages === Pages.Withdrawn) {
    pagesClause = 'WHERE withdrawn_at IS NOT NULL';
  } else {
    pagesClause = 'WHERE TRUE';
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

  let documentTypeClause = '';
  if (searchParams.selectedDocumentType !== '') {
    documentTypeClause = `
      AND documentType = @documentType
    `;
  }


  let sorting = '';
  if(searchParams.sorting === Sorting.PageViewsAsc){
    sorting =  `ORDER BY page_views ASC`;
  } else if(searchParams.sorting === Sorting.RecentlyUpdated){
    sorting =  `ORDER BY first_published_at DESC`;
  } else if(searchParams.sorting === Sorting.RecentlyPublished ){
    sorting =  `ORDER BY public_updated_at DESC`;
  } else {
    sorting = `ORDER BY page_views DESC`;
  }

  let linkClause = '';
  if (searchParams.linkSearchUrl !== '') {
    // external link search: look for url as substring
    linkClause = `
      AND EXISTS
        (
          SELECT 1 FROM UNNEST (hyperlinks) AS link
          WHERE CONTAINS_SUBSTR(link.link_url, @link)
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
      organisations AS all_organisations,
      hyperlinks,
      description,
      ${truncatedContent}
      ${textOccurrences}
      ${linkOccurrences}

    FROM search.page

    ${pagesClause}
    ${includeClause}
    ${excludeClause}
    ${areaClause}
    ${localeClause}
    ${taxonClause}
    ${organisationClause}
    ${documentTypeClause}
    ${linkClause}
    ${sorting}

    LIMIT 10000
  `;
};


export {
  getBankHolidayInfo,
  getTransactionInfo,
  getOrganisationInfo,
  getDocumentTypeInfo,
  getPersonInfo,
  getRoleInfo,
  getTaxonInfo,
  sendInitQuery,
  sendSearchQuery
};
