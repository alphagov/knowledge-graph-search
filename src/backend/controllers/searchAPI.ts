import { RequestHandler } from 'express'
import {
  sendInitQuery,
  sendSearchQuery,
  getTaxonInfo,
} from '../bigquery/bigquery'

import { SearchParams } from '../../frontend/types/search-api-types'
import { getParams } from '../../utils/getParams'

class SearchAPIController {
  public getInitData: RequestHandler = async (req, res) => {
    try {
      const response = await sendInitQuery()
      res.send(response)
    } catch (e) {
      res.status(500).send(e)
    }
  }

  public searchApi: RequestHandler = async (req, res) => {
    const params: SearchParams = getParams(req)
    try {
      const data = await sendSearchQuery(params)
      res.send(data)
    } catch (e: any) {
      res.status(500).send(e)
    }
  }

  public searchTaxon: RequestHandler = async (req, res) => {
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
  }
}

export default SearchAPIController
