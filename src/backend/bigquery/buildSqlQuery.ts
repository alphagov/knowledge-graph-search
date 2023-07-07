import { Combinator, SearchParams } from '../../common/types/search-api-types'

export const buildSqlQuery = function (
  searchParams: SearchParams,
  keywords: string[],
  excludedKeywords: string[]
): string {
  const contentToSearch = []
  if (searchParams.whereToSearch.title) {
    contentToSearch.push('IFNULL(page.title, "")')
  }
  if (searchParams.whereToSearch.text) {
    contentToSearch.push(
      'IFNULL(page.text, "")',
      'IFNULL(page.description, "")'
    )
  }
  const contentToSearchString = contentToSearch.join(' || " " || ')

  const includeClause =
    keywords.length === 0
      ? null
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
      ? null
      : 'AND NOT (' +
        [...Array(excludedKeywords.length).keys()]
          .map((index) =>
            searchParams.caseSensitive
              ? `STRPOS(${contentToSearchString}, @excluded_keyword${index}) <> 0`
              : `CONTAINS_SUBSTR(${contentToSearchString}, @excluded_keyword${index})`
          )
          .join(' OR ') +
        ')'

  let areaClause = null
  if (searchParams.areaToSearch === 'publisher') {
    areaClause = 'AND publishing_app = "publisher"'
  } else if (searchParams.areaToSearch === 'whitehall') {
    areaClause = 'AND publishing_app = "whitehall"'
  }

  let localeClause = null
  if (searchParams.selectedLocale !== '') {
    localeClause = `AND locale = @locale`
  }

  let taxonClause = null
  if (searchParams.selectedTaxon !== '') {
    taxonClause = `
  AND EXISTS
    (
      SELECT 1 FROM UNNEST (taxons) AS taxon
      WHERE taxon = @taxon
    )
  `
  }

  let organisationClause = null
  if (searchParams.selectedOrganisation !== '') {
    organisationClause = `
  AND EXISTS
    (
      SELECT 1 FROM UNNEST (organisations) AS link
      WHERE link = @organisation
    )
  `
  }

  let linkClause = null
  if (searchParams.linkSearchUrl !== '') {
    // Link search: look for url as substring
    linkClause = `
  AND EXISTS
    (
      SELECT 1 FROM UNNEST (hyperlinks) AS link
      WHERE CONTAINS_SUBSTR(link, @link)
    )
  `
  }

  const prefix = `
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
  
  WHERE TRUE`

  const suffix = `
  ORDER BY page_views DESC
  LIMIT 10000`

  const clauses = [
    includeClause,
    excludeClause,
    areaClause,
    localeClause,
    taxonClause,
    organisationClause,
    linkClause,
  ]

  let clausesPart = ''
  clauses.forEach((clause) => {
    if (clause) {
      clausesPart += `\n${clause}`
    }
  })

  const finalQuery = `${prefix}${clausesPart}${suffix}`

  return finalQuery
}
