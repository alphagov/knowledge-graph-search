import { RequestHandler } from 'express'

export const pageNotFound: RequestHandler = (req, res): void => {
  const status = 404
  const title = 'Page not found'
  const message = `<p class="govuk-body">If you typed the web address, check it is correct.</p>
                 <p class="govuk-body">If you pasted the web address, check you copied the entire address.<p>`

  res.status(status).render('errors.njk', {
    title,
    message,
    status,
  })
}
