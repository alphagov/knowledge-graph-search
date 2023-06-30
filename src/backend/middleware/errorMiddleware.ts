import { Response, Request } from 'express'

export const errorMiddleware = (error: any, req: Request, res: Response):void => {
  const status = error.response.status || 500;
  const title = 'Sorry, there is a problem with the service';
  const message = '<p class="govuk-body">Try again later.</p><p class="govuk-body">Please <a class="govuk-link" href="mailto:data-products-research@digital.cabinet-office.gov.uk">contact the Data Products team</a> if the problem persists.</p>'
  res.status(status).render('errors.njk', {
    title,
    message,
    status,
  })
};
