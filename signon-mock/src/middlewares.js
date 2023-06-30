export const logReq = (req, res, next) => {
  console.log('NEW REQUEST')
  const { path, query, params, body, headers } = req
  console.log({ path, query, params, body, headers })
  return next()
}
