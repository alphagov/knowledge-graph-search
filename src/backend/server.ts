/* eslint-disable import/first */
// Enables source mapping of the compiled code
// Must be the first statement of the application
import 'source-map-support/register'

import dotenv from 'dotenv'
dotenv.config()

import App from './app'
import AuthRoutes from './routes/AuthRoutes'
import IndexRoutes from './routes/IndexRoutes'
import config from './config'
import Routes from './constants/routes'

const routesList: Routes[] = [new IndexRoutes()]
if (config.authEnabled) {
  routesList.push(new AuthRoutes())
}
const app = new App(routesList)

app.listen()
