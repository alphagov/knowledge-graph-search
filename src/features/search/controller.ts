import { RequestHandler } from 'express';
import { Route } from '../../interfaces/routes.interface';
import {
  sendInitQuery,
  sendSearchQuery,
} from '../../../bigquery';

import {
  SearchParams,
  SearchType,
  Combinator,
  SearchArea,
} from '../../ts/search-api-types';

import { sanitiseInput } from '../../ts/utils'

class SearchController {
  public search: RequestHandler = (req, res, next) => {
    try {
      res.render('features/search/view.njk');
    } catch (e) {
      next(e);
    }
  };

  public getInitData: RequestHandler = async (req, res, next) => {
    console.log('/get-init-data')
    try {
      const response = await sendInitQuery();
      res.send(response)
    } catch (e) {
      console.log('/get-init-data fail:', JSON.stringify(e))
      res.status(500).send(e)
    }
  };

  public searchApi: RequestHandler = async (req, res, next) => {
    console.log('API call to /search', req.query)
    // retrieve qsp params
    const params: SearchParams = {
      searchType:
        <SearchType>sanitiseInput(String(req.query['search-type'])) || SearchType.Keyword,
      selectedWords: sanitiseInput(`${req.query['selected-words']}`) || '',
      excludedWords: sanitiseInput(`${req.query['excluded-words']}`) || '',
      selectedTaxon: sanitiseInput(`${req.query['selected-taxon']}`) || '',
      selectedOrganisation:
        sanitiseInput(`${req.query['selected-organisation']}`) || '',
      selectedLocale: sanitiseInput(`${req.query.lang}`) || '',
      caseSensitive: `${req.query['case-sensitive']}` === 'true',
      combinator:
        <Combinator>sanitiseInput(`${req.query.combinator}`) || Combinator.All,
      whereToSearch: {
        title: !(req.query['search-in-title'] === 'false'),
        text: !(req.query['search-in-text'] === 'false'),
      },
      areaToSearch: <SearchArea>sanitiseInput(`${req.query.area}`) || SearchArea.Any,
      linkSearchUrl: sanitiseInput(`${req.query['link-search-url']}`) || '',
    }
    try {
      const data = await sendSearchQuery(params)
      res.send(data)
    } catch (e: any) {
      console.log('/search fail:', JSON.stringify(e))
      res.status(500).send(e)
    }
  };

}

export default SearchController;
