import * as express from 'express';
import {
  SearchParams,
  Combinator,
  SearchArea,
  SearchType,
} from '../frontend/types/search-api-types';
import { sanitiseInput } from '../utils/utils';

export const getParams = (req: express.Request): SearchParams  => {
  const searchType = <SearchType>(sanitiseInput(req.query['search-type'] as string) || SearchType.Keyword);
  const selectedWords = sanitiseInput(req.query['selected-words'] as string) || '';
  const excludedWords = sanitiseInput(req.query['excluded-words'] as string) || '';
  const selectedTaxon = sanitiseInput(req.query['selected-taxon'] as string) || '';
  const selectedOrganisation = sanitiseInput(req.query['selected-organisation'] as string) || '';
  const selectedLocale = sanitiseInput(req.query.lang as string) || '';
  const caseSensitive = req.query['case-sensitive'] === 'true';
  const combinator = <Combinator>(sanitiseInput(req.query.combinator as string) || Combinator.All);
  const whereToSearch = {
    title: !(req.query['search-in-title'] === 'false'),
    text: !(req.query['search-in-text'] === 'false'),
  };
  const areaToSearch = <SearchArea>(sanitiseInput(req.query.area as string) || SearchArea.Any);
  const linkSearchUrl = sanitiseInput(req.query['link-search-url'] as string) || '';
  return {
    searchType,
    selectedWords,
    excludedWords,
    selectedTaxon,
    selectedOrganisation,
    selectedLocale,
    caseSensitive,
    combinator,
    whereToSearch,
    areaToSearch,
    linkSearchUrl,
  };
};

export default getParams;
