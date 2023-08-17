import webpack from 'webpack'
import webpackDevMiddleware from 'webpack-dev-middleware'
import webpackHotMiddleware from 'webpack-hot-middleware'
const webpackConfig: any = require('../../../webpack.config.js')

const compiler = webpack(webpackConfig)

export const devMiddleware = webpackDevMiddleware(compiler, {
  publicPath: webpackConfig.output.publicPath,
})
export const hotMiddleware = webpackHotMiddleware(compiler)
