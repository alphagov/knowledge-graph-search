import { RequestHandler } from 'express'

export const hideFeedbackSurvey: RequestHandler = (req, res, next) => {
  if (req.cookies.feedbackSurvey) {
    res.locals.seenFeedbackSurvey = true
  } else {
    res.locals.seenFeedbackSurvey = false
  }
  next()
}
