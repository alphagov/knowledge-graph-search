import { RequestHandler } from 'express'

export const hideFeedbackSurvey: RequestHandler = (req, res, next) => {
  if (req.cookies.hideFeedbackSurvey) {
    res.locals.hideFeedbackSurvey = true
  } else {
    res.locals.hideFeedbackSurvey = false
  }
  next()
}
