import {
  Combinator,
  KeywordLocation,
  PublishingStatus,
  PoliticalStatus,
  SearchParams,
  SearchType,
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

  const includeOccurrences =
    searchParams.searchType !== SearchType.Language &&
    searchParams.keywordLocation !== KeywordLocation.Title

  let occurrences = ''
  if (includeOccurrences) {
    // For counting occurences of substrings, see https://stackoverflow.com/a/2906296/937932
    const textOccurrences = [...Array(keywords.length).keys()].map(
      (index) =>
        `STRUCT(
                 @keyword${index} AS keyword,
                ${
                  searchParams.caseSensitive
                    ? `DIV(
                         (SELECT (LENGTH(${contentToSearchString}) - LENGTH(REPLACE(${contentToSearchString}, @keyword${index}, '')))),
                         LENGTH(@keyword${index})
                       ) AS occurrences`
                    : `DIV(
                         (SELECT (LENGTH(${contentToSearchString}) - LENGTH(REPLACE(LOWER(${contentToSearchString}), LOWER(@keyword${index}), '')))),
                         LENGTH(@keyword${index})
                       ) AS occurrences`
                }
               )`
    )

    const linkOccurrences =
      searchParams.linkSearchUrl === ''
        ? []
        : [
            `STRUCT(
          @link AS keyword,
          (SELECT COUNT(1) FROM UNNEST(hyperlinks) as hyperlink WHERE CONTAINS_SUBSTR(hyperlink.link_url, @link)) AS occurrences)`,
          ]

    const phoneNumberOccurrences =
      searchParams.phoneNumber === undefined || searchParams.phoneNumber === ''
        ? []
        : [
            `STRUCT(
          @phoneNumber AS keyword,
          (SELECT COUNT(1) FROM UNNEST(phone_numbers) as phone_number WHERE phone_number = @phoneNumber) AS occurrences)`,
          ]

    occurrences = `[${[
      ...textOccurrences,
      ...linkOccurrences,
      ...phoneNumberOccurrences,
    ].join(', ')}] AS occurrences,`
  }

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
  if (searchParams.publishingApp !== '') {
    publishingAppClause = `AND publishing_app = @publishingApp`
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
  if (searchParams.language !== '') {
    localeClause = `AND locale = @locale`
  }

  let taxonClause = ''
  if (searchParams.taxon !== '') {
    taxonClause = `
      AND EXISTS
        (
          SELECT 1 FROM UNNEST (taxons) AS taxon
          WHERE taxon = @taxon
        )
    `
  }

  let organisationClause = ''
  if (searchParams.publishingOrganisation !== '') {
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
    if (searchParams.linksExactMatch) {
      linkClause = `
        AND EXISTS
          (
            SELECT 1 FROM UNNEST (hyperlinks) AS link
            WHERE
            @link = link.link_url
            OR CONCAT('http://www.gov.uk', @link) = link.link_url
            OR CONCAT('http://www.gov.uk/', @link) = link.link_url
            OR CONCAT('https://www.gov.uk', @link) = link.link_url
            OR CONCAT('https://www.gov.uk/', @link) = link.link_url
          )
      `
    } else {
      linkClause = `
        AND EXISTS
          (
            SELECT 1 FROM UNNEST (hyperlinks) AS link
            WHERE CONTAINS_SUBSTR(link.link_url, @link)
          )
      `
    }
  }

  let phoneNumberClause = ''
  if (searchParams.phoneNumber && searchParams.phoneNumber !== '') {
    // Phone number search: exact matches only of phone numbers in standard E.164 form
    phoneNumberClause = `
      AND EXISTS
        (
          SELECT 1 FROM UNNEST (phone_numbers) AS phone_number
          WHERE phone_number = @phoneNumber
        )
    `
  }

  let documentTypeClause = ''
  if (searchParams.documentType !== '') {
    documentTypeClause = `
      AND documentType = @documentType
    `
  }

  let politicalStatusClause = ''
  if (searchParams.politicalStatus !== PoliticalStatus.Any) {
    politicalStatusClause = `
      AND is_political = (@politicalStatus = 'political')
    `
  }

  let governmentClause = ''
  if (searchParams.government !== '') {
    governmentClause = `
      AND government = @government
    `
  }

  let associatedPersonClause = ''
  if (searchParams.associatedPerson !== '') {
    associatedPersonClause = `
      AND EXISTS
        (
          SELECT 1 FROM UNNEST (people) AS person
          WHERE person = @associatedPerson
        )
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
      organisations AS all_organisations,
      government,
      is_political,
      people,
      ${occurrences}
    FROM search.page

    ${publishingStatusClause}
    ${includeClause}
    ${excludeClause}
    ${publishingAppClause}
    ${localeClause}
    ${taxonClause}
    ${organisationClause}
    ${linkClause}
    ${phoneNumberClause}
    ${documentTypeClause}
    ${politicalStatusClause}
    ${governmentClause}
    ${associatedPersonClause}

    ORDER BY page_views DESC
    LIMIT 10000
  `
}
