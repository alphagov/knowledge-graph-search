import { Router } from 'express'
import SearchController from '../controllers/search.controller'
import SearchAPIController from '../controllers/searchAPI.controller'
import InfoBoxController from '../controllers/infoBox.controller'
import DownloadCSVController from '../controllers/downloadCSV.controller'
import CookiesController from '../controllers/cookies.controller'
import FeedbackSurveyController from '../controllers/feedbackSurvey.controller'
import Routes, { Route } from '../enums/routes'
import { auth } from '../middleware/auth'

class IndexRoute implements Routes {
  public router = Router()
  public searchController = new SearchController()
  public searchAPIController = new SearchAPIController()
  public infoBoxController = new InfoBoxController()
  public downloadCSVController = new DownloadCSVController()
  public cookiesController = new CookiesController()
  public feedbackSurveyController = new FeedbackSurveyController()

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

    this.router.get(Route.cookies, auth(), this.cookiesController.cookies)

    this.router.post(
      Route.saveCookieSettings,
      auth(),
      this.cookiesController.saveCookieSettings
    )

    this.router.post(
      Route.hideCookieSuccessBanner,
      auth(),
      this.cookiesController.hideCookieSuccessBanner
    )

    this.router.get(
      Route.feedbackSurvey,
      auth(),
      this.feedbackSurveyController.feedbackSurvey
    )

    this.router.get(
      Route.hideFeedbackSurvey,
      auth(),
      this.feedbackSurveyController.hideFeedbackSurvey
    )
  }
}

export default IndexRoute
