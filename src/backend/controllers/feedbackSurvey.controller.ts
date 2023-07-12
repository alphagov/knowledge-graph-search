import { RequestHandler } from 'express'
import { setCookie } from '../utils/setCookie'

class FeedbackSurveyController {
  public feedbackSurvey: RequestHandler = (req, res, next) => {
    try {
      setCookie(res, 'hideFeedbackSurvey', 'true')
      res.redirect('https://surveys.publishing.service.gov.uk/s/2KQY5W/')
    } catch (e) {
      next(e)
    }
  }

  public hideFeedbackSurvey: RequestHandler = (req, res, next) => {
    try {
      setCookie(res, 'hideFeedbackSurvey', 'true')
      res.redirect(`${req.headers.referer}`)
    } catch (e) {
      next(e)
    }
  }
}

export default FeedbackSurveyController
