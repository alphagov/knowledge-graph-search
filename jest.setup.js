process.env.GTM_ID = 'SOME_GTM_ID'
process.env.GTM_AUTH = 'GTM_AUTH'
process.env.TESTING_ENV = 'true'

process.on('uncaughtException', function (err) {
  console.error('Caught exception: ', err)
})

process.on('unhandledRejection', function (reason, p) {
  console.error('Unhandled Rejection at: Promise ', p, ' reason: ', reason)
})
