// These middlewares should only be used during local development

import webpack from 'webpack'
import webpackDevMiddleware from 'webpack-dev-middleware'
import webpackHotMiddleware from 'webpack-hot-middleware'
import config from '../config'
const { enableHMR } = config
const webpackConfig: any = require('../../../webpack.config.js')({ enableHMR })

const compiler = webpack(webpackConfig)

export const devMiddleware = () =>
  webpackDevMiddleware(compiler, {
    publicPath: webpackConfig.output.publicPath,
  })
export const hotMiddleware = () => webpackHotMiddleware(compiler)
