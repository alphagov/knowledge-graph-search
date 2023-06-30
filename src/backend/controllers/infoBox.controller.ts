import { RequestHandler } from 'express'

import {
  getOrganisationInfo,
  getRoleInfo,
  getBankHolidayInfo,
  getTransactionInfo,
  getPersonInfo,
} from '../bigquery/bigquery'

class InfoBoxController {
  public infoBoxOrganisation: RequestHandler = async (req, res) => {
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
  }

  public infoBoxRole: RequestHandler = async (req, res) => {
    try {
      const data = await getRoleInfo(req.query.name as string)
      res.send(data)
    } catch (e: any) {
      res.status(500).send(e)
    }
  }

  public infoBoxBankHoliday: RequestHandler = async (req, res) => {
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
  }

  public infoBoxTransaction: RequestHandler = async (req, res) => {
    try {
      const data = await getTransactionInfo(req.query.name as string)
      res.send(data)
    } catch (e: any) {
      res.status(500).send(e)
    }
  }

  public infoBoxPerson: RequestHandler = async (req, res) => {
    try {
      const data = await getPersonInfo(req.query.name as string)
      res.send(data)
    } catch (e: any) {
      res.status(500).send(e)
    }
  }
}

export default InfoBoxController
