import { RequestHandler } from 'express'
import { sendSearchQuery } from '../bigquery/bigquery'
import { SearchParams } from '../../common/types/search-api-types'
import { getParams } from '../utils/getParams'
import { csvStringify } from '../utils/csv'
import log from '../utils/logging'

class DownloadCSVController {
  public downloadCSV: RequestHandler = async (req, res) => {
    const params: SearchParams = getParams(req)
    try {
      const data = await sendSearchQuery(params)
      const csvData = csvStringify(data)
      res.set('Content-Type', 'text/csv')
      res.send(csvData)
    } catch (error) {
      log.error(error, '/csv fail')
      res.status(500).send(error)
    }
  }
}

export default DownloadCSVController
