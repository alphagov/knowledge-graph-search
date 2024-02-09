import { Router } from 'express'

interface Routes {
  path?: string
  router: Router
}

export enum Route {
  me = '/me',
  search = '/',
  getInitData = '/get-init-data',
  searchApi = '/search',
  searchTaxon = '/taxon',
  downloadCSV = '/csv',
  login = '/login',
  loginCallback = '/auth/gds/callback',
  reauth = '/auth/gds/api/users/:userId/reauth',
  cookies = '/cookies',
  saveCookieSettings = '/save-cookie-settings',
  hideCookieSuccessBanner = '/hide-cookie-success-banner',
  updateUserPermissions = '/auth/gds/api/users/:userId',
  feedbackSurvey = '/feedback-survey',
  hideFeedbackSurvey = '/hide-feedback-survey',
}

export default Routes
