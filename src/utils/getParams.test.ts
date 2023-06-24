import { Request } from 'express'
import { getParams } from './getParams';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getParams', () => {
  it('Should return the parameters', () => {
    const req = {
      query: {
        'search-type': 'some search-type',
        'selected-words': 'some selected-words',
        'excluded-words': 'some excluded-words',
        'selected-taxon': 'some selected-taxon',
        'selected-organisation': 'some selected-organisation',
        'lang': 'some lang',
        'case-sensitive': 'true',
        'combinator': 'some combinator',
        'search-in-title': 'some search-in-title',
        'search-in-text': 'some search-in-text',
        'area': 'some area',
        'link-search-url': 'some link-search-url',
      },
    } as unknown as Request

    expect(getParams(req)).toStrictEqual({
      "areaToSearch": "some area",
      "caseSensitive": true,
      "combinator": "some combinator",
      "excludedWords": "some excluded-words",
      "linkSearchUrl": "some link-search-url",
      "searchType": "some search-type",
      "selectedLocale": "some lang",
      "selectedOrganisation": "some selected-organisation",
      "selectedTaxon": "some selected-taxon",
      "selectedWords": "some selected-words",
      "whereToSearch": {
        "text": true,
        "title": true,
      },
    });
  });

  it('Should return the parameters', () => {
    const req = {
      query: {
        'search-type': '',
        'selected-words': '',
        'excluded-words': '',
        'selected-taxon': '',
        'selected-organisation': '',
        'lang': '',
        'case-sensitive': 'true',
        'combinator': '',
        'search-in-title': 'some search-in-title',
        'search-in-text': 'some search-in-text',
        'area': '',
        'link-search-url': '',
      },
    } as unknown as Request

    expect(getParams(req)).toStrictEqual({
      "areaToSearch": "any",
      "caseSensitive": true,
      "combinator": "all",
      "excludedWords": "",
      "linkSearchUrl": "",
      "searchType": "keyword",
      "selectedLocale": "",
      "selectedOrganisation": "",
      "selectedTaxon": "",
      "selectedWords": "",
      "whereToSearch": {
        "text": true,
        "title": true,
      },
    });
  });
});
