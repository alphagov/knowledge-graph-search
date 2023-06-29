import { RequestHandler } from 'express'

export const error404: RequestHandler = (req, res, next):void => {
  const status = 404;
  const title = 'Page not found';
  const message = `<p class="govuk-body">If you typed the web address, check it is correct.</p>
                 <p class="govuk-body">If you pasted the web address, check you copied the entire address.<p>`;
  res.status(status).render('errors.njk', {
    title,
    message,
    status,
  });
};
