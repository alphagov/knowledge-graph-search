import { RequestHandler } from 'express';
import { sendSearchQuery } from '../../bigquery/bigquery';
import { SearchParams } from '../../../frontend/types/search-api-types';
import { getParams } from '../../../utils/getParams';
import { csvStringify } from '../../../utils/csv';

class DownloadCSVController {
  public downloadCSV: RequestHandler = async (req, res, next) => {
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
};

export default DownloadCSVController;
