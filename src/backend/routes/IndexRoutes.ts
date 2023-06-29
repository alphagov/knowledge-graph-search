import { Router } from 'express'
import SearchController from '../controllers/SearchController'
import SearchAPIController from '../controllers/SearchAPIController'
import InfoBoxController from '../controllers/InfoBoxController'
import DownloadCSVController from '../controllers/DownloadCSVController'
import Routes, { Route } from '../enums/routes'
import { auth } from '../middleware/auth'

class IndexRoute implements Routes {
  public router = Router()
  public searchController = new SearchController()
  public searchAPIController = new SearchAPIController()
  public infoBoxController = new InfoBoxController()
  public downloadCSVController = new DownloadCSVController()

  constructor() {
    this.initializeRoutes()
  }

  private initializeRoutes() {
    this.router.get(Route.search, auth(), this.searchController.search)

    this.router.get(
      Route.getInitData,
      auth(),
      this.searchAPIController.getInitData
    )

    this.router.get(Route.searchApi, auth(), this.searchAPIController.searchApi)

    this.router.get(
      Route.searchTaxon,
      auth(),
      this.searchAPIController.searchTaxon
    )

    this.router.get(
      Route.downloadCSV,
      auth(),
      this.downloadCSVController.downloadCSV
    )

    this.router.get(
      Route.infoBoxOrganisation,
      auth(),
      this.infoBoxController.infoBoxOrganisation
    )

    this.router.get(
      Route.infoBoxRole,
      auth(),
      this.infoBoxController.infoBoxRole
    )

    this.router.get(
      Route.infoBoxBankHoliday,
      auth(),
      this.infoBoxController.infoBoxBankHoliday
    )

    this.router.get(
      Route.infoBoxTransaction,
      auth(),
      this.infoBoxController.infoBoxTransaction
    )

    this.router.get(
      Route.infoBoxPerson,
      auth(),
      this.infoBoxController.infoBoxPerson
    )
  }
}

export default IndexRoute
