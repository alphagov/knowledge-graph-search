import { errorMiddleware } from './errorMiddleware'
import { expect } from '@jest/globals'

afterAll(async () => {
  await new Promise<void>((resolve) => setTimeout(() => resolve(), 500))
})

afterEach(() => {
  jest.resetAllMocks()
})

const title = 'Sorry, there is a problem with the service'
const message =
  '<p class="govuk-body">Try again later.</p><p class="govuk-body">Please <a class="govuk-link" href="mailto:data-products-research@digital.cabinet-office.gov.uk">contact the Data Products team</a> if the problem persists.</p>'

describe('errorMiddleware', () => {
  const res: any = {
    render: jest.fn(),
  }

  const req: any = jest.fn()

  test('It should return error message with status 510', async () => {
    res.status = jest.fn().mockReturnThis()
    const error: any = {
      response: {
        status: 510,
        title,
        message,
      },
    }
    const { status } = error.response
    await errorMiddleware(error, req, res)
    expect(res.status).toHaveBeenCalledWith(error.response.status)
    expect(res.render).toHaveBeenCalledWith('errors.njk', {
      title,
      message,
      status,
    })
  })

  test('It should return error message and default to 500 when no error.response.status', async () => {
    res.status = jest.fn().mockReturnThis()
    const error: any = {
      response: {
        satus: null,
      },
    }

    await errorMiddleware(error, req, res)
    expect(res.render).toHaveBeenCalledWith('errors.njk', {
      title,
      message,
      status: 500,
    })
  })

  test('It should return error message and default to 500 when no error.response', async () => {
    res.status = jest.fn().mockReturnThis()
    const error: any = {}
    
    await errorMiddleware(error, req, res)
    expect(res.render).toHaveBeenCalledWith('errors.njk', {
      title,
      message,
      status: 500,
    })
  })
})
