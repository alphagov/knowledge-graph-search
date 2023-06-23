import { RequestHandler } from 'express';
import { Route } from '../../interfaces/routes';
import {
  sendInitQuery,
  sendSearchQuery,
  getTaxonInfo,
  getOrganisationInfo,
  getRoleInfo,
  getBankHolidayInfo,
  getTransactionInfo,
  getPersonInfo
} from '../../bigquery/bigquery';

import {
  SearchParams,
  SearchType,
  Combinator,
  SearchArea,
} from '../../../frontend/types/search-api-types';

import { sanitiseInput } from '../../../utils/utils'
import { getParams } from '../../../utils/getParams';
import { csvStringify } from '../../../utils/csv';

class SearchController {
  public index: RequestHandler = (req, res, next) => {
    try {
      res.render('backend/features/search/view.njk');
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
    const params: SearchParams = getParams(req);
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

  public downladCSV: RequestHandler = async (req, res, next) => {
    const params: SearchParams = getParams(req);
    try {
      const data = await sendSearchQuery(params)
      const csvData = csvStringify(data.main)
      res.set('Content-Type', 'text/csv')
      res.send(csvData)
    } catch (e: any) {
      console.log('/csv fail:', JSON.stringify(e))
      res.status(500).send(e)
    }
  };

  public infoBoxOrganisation: RequestHandler = async (req, res, next) => {
    try {
      const data = await getOrganisationInfo(req.query.name as string)
      res.send(data)
    } catch (e: any) {
      if (e.status === 404) {
        res.status(e.status).send(e.message)
      } else {
        res.status(500).send(e.message)
      }
    }
  };

  public infoBoxRole: RequestHandler = async (req, res, next) => {
    try {
      const data = await getRoleInfo(req.query.name as string)
      res.send(data)
    } catch (e: any) {
      res.status(500).send(e)
    }
  };

  public infoBoxBankHoliday: RequestHandler = async (req, res, next) => {
    try {
      const data = await getBankHolidayInfo(req.query.name as string)
      res.send(data)
    } catch (e: any) {
      if (e.status === 404) {
        res.status(e.status).send(e.message)
      } else {
        res.status(500).send(e.message)
      }
    }
  };

  public infoBoxTransaction: RequestHandler = async (req, res, next) => {
    try {
      const data = await getTransactionInfo(req.query.name as string)
      res.send(data)
      } catch (e: any) {
        res.status(500).send(e)
      }
  };

  public infoBoxPerson: RequestHandler = async (req, res, next) => {
    try {
      const data = await getPersonInfo(req.query.name as string)
      res.send(data)
    } catch (e: any) {
      res.status(500).send(e)
    }
  };

};

export default SearchController;
