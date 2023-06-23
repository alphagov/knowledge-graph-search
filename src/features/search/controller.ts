import { RequestHandler } from 'express';
import { Route } from '../../interfaces/routes.interface';
import {
  sendInitQuery,
  sendSearchQuery,
  getTaxonInfo,
} from '../../../bigquery';

import {
  SearchParams,
  SearchType,
  Combinator,
  SearchArea,
} from '../../ts/search-api-types';

import { sanitiseInput } from '../../ts/utils'

class SearchController {
  public index: RequestHandler = (req, res, next) => {
    try {
      res.render('features/search/view.njk');
    } catch (e) {
      next(e);
    }
  };

  public getInitData: RequestHandler = async (req, res, next) => {
    try {
      const response = await sendInitQuery();
      res.send(response)
    } catch (e) {
      res.status(500).send(e)
    }
  };

  public searchApi: RequestHandler = async (req, res, next) => {
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

    const params: SearchParams = {
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
    }
    try {
      const data = await sendSearchQuery(params)
      res.send(data)
    } catch (e: any) {
      res.status(500).send(e)
    }
  };

  public searchTaxon: RequestHandler = async (req, res, next) => {
    try {
      const data = await getTaxonInfo(req.query.name as string)
      res.send(data)
    } catch (e: any) {
      if (e.status === 404) {
        res.status(e.status).send(e.message)
      } else {
        res.status(500).send(e.message)
      }
    }
  };

}

export default SearchController;
