import { hideFeedbackSurvey } from './hideFeedbackSurvey'
import { expect } from '@jest/globals'

const req: any = {
  cookies: {
    feedbackSurvey: 'true',
  },
}
const next: any = jest.fn()
const res: any = {
  headers: {},
  locals: {},
  cookie(name: any, value: any) {
    this.headers[name] = value
  },
}

describe('hideFeedbackSurvey', () => {
  it('Should return the correct object', () => {
    hideFeedbackSurvey(req, res, next)
    expect(res.locals).toEqual({
      seenFeedbackSurvey: true,
    })
  })
})
