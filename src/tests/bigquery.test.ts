import {
  SearchParams,
  Combinator,
  SearchArea,
  SearchType,
} from "../ts/search-api-types";
import { buildSqlQuery } from "../../bigquery";

const makeParams = (opts = {}) =>
  ({
    linkSearchUrl: "",
    whereToSearch: { title: true, text: true },
    caseSensitive: false,
    combinator: Combinator.Any,
    areaToSearch: SearchArea.Any,
    selectedLocale: "",
    selectedTaxon: "",
    selectedOrganisation: "",
    searchType: SearchType.Advanced,
    selectedWords: "",
    excludedWords: "",
    ...opts,
  } as SearchParams);

describe("buildSqlQuery", () => {
  test("includes linkClause when searchParams.linkSearchUrl is not an empty string", () => {
    const searchParams: SearchParams = makeParams({
      linkSearchUrl: "test-url",
    });
    const keywords: string[] = [];
    const excludedKeywords: string[] = [];

    const query = buildSqlQuery(searchParams, keywords, excludedKeywords);

    expect(query).toContain(
      `AND EXISTS
        (
          SELECT 1 FROM UNNEST (hyperlinks) AS link
          WHERE CONTAINS_SUBSTR(link, @link)
        )`
    );
  });

  test("doesn't include linkClause when searchParams.linkSearchUrl is an empty string", () => {
    const searchParams: SearchParams = makeParams();
    const keywords: string[] = [];
    const excludedKeywords: string[] = [];

    const query = buildSqlQuery(searchParams, keywords, excludedKeywords);

    expect(query).not.toContain(
      `AND EXISTS
        (
          SELECT 1 FROM UNNEST (hyperlinks) AS link
          WHERE CONTAINS_SUBSTR(link, @link)
        )`
    );
  });
});
