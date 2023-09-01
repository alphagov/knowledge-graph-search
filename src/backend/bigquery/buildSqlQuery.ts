import {
  Combinator,
  KeywordLocation,
  PublishingStatus,
  SearchParams,
} from '../../common/types/search-api-types'

export const buildSqlQuery = function (
  searchParams: SearchParams,
  keywords: string[],
  excludedKeywords: string[]
): string {
  const contentToSearch = []
  if (searchParams.keywordLocation === KeywordLocation.Title) {
    contentToSearch.push('IFNULL(page.title, "")')
  } else if (searchParams.keywordLocation === KeywordLocation.BodyContent) {
    contentToSearch.push('IFNULL(page.text, "")')
  } else if (searchParams.keywordLocation === KeywordLocation.Description) {
    contentToSearch.push('IFNULL(page.description, "")')
  } else {
    contentToSearch.push('IFNULL(page.title, "")')
    contentToSearch.push('IFNULL(page.text, "")')
    contentToSearch.push('IFNULL(page.description, "")')
  }
  const contentToSearchString = contentToSearch.join(' || " " || ')

  const includeClause =
    keywords.length === 0
      ? ''
      : 'AND (' +
        [...Array(keywords.length).keys()]
          .map((index) =>
            searchParams.caseSensitive
              ? `STRPOS(${contentToSearchString}, @keyword${index}) <> 0`
              : `CONTAINS_SUBSTR(${contentToSearchString}, @keyword${index})`
          )
          .join(searchParams.combinator === Combinator.Any ? ' OR ' : ' AND ') +
        ')'

  const excludeClause =
    excludedKeywords.length === 0
      ? ''
      : 'AND NOT (' +
        [...Array(excludedKeywords.length).keys()]
          .map((index) =>
            searchParams.caseSensitive
              ? `STRPOS(${contentToSearchString}, @excluded_keyword${index}) <> 0`
              : `CONTAINS_SUBSTR(${contentToSearchString}, @excluded_keyword${index})`
          )
          .join(' OR ') +
        ')'
  let publishingAppClause = ''
  if (searchParams.publishingApplication === 'publisher') {
    publishingAppClause = 'AND publishing_app = "publisher"'
  } else if (searchParams.publishingApplication === 'whitehall') {
    publishingAppClause = 'AND publishing_app = "whitehall"'
  }

  let publishingStatusClause = ''
  if (searchParams.publishingStatus === PublishingStatus.NotWithdrawn) {
    publishingStatusClause = 'WHERE withdrawn_at IS NULL'
  } else if (searchParams.publishingStatus === PublishingStatus.Withdrawn) {
    publishingStatusClause = 'WHERE withdrawn_at IS NOT NULL'
  } else {
    publishingStatusClause = 'WHERE TRUE'
  }

  let localeClause = ''
  if (searchParams.selectedLocale !== '') {
    localeClause = `AND locale = @locale`
  }

  let taxonClause = ''
  if (searchParams.selectedTaxon !== '') {
    taxonClause = `
      AND EXISTS
        (
          SELECT 1 FROM UNNEST (taxons) AS taxon
          WHERE taxon = @taxon
        )
    `
  }

  let organisationClause = ''
  if (searchParams.selectedPublishingOrganisation !== '') {
    organisationClause = `
      AND EXISTS
        (
          SELECT 1 FROM UNNEST (organisations) AS link
          WHERE link = @organisation
        )
    `
  }

  let linkClause = ''
  if (searchParams.linkSearchUrl !== '') {
    // Link search: look for url as substring
    linkClause = `
      AND EXISTS
        (
          SELECT 1 FROM UNNEST (hyperlinks) AS link
          WHERE CONTAINS_SUBSTR(link.link_url, @link)
        )
    `
  }

  let documentTypeClause = ''
  if (searchParams.selectedDocumentType !== '') {
    documentTypeClause = `
      AND documentType = @documentType
    `
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
    
    ${publishingStatusClause}
    ${includeClause}
    ${excludeClause}
    ${publishingAppClause}
    ${localeClause}
    ${taxonClause}
    ${organisationClause}
    ${linkClause}
    ${documentTypeClause}
    ORDER BY page_views DESC
    LIMIT 10000
  `
}
