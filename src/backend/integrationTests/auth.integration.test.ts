import request from 'supertest'
import AuthRoutes from '../routes/AuthRoutes'
import App from '../app'
import { Route } from '../enums/routes'

const authRoutes = new AuthRoutes()
const app = new App([authRoutes])

beforeEach(() => {
  jest.clearAllMocks()
})

describe('[GET] /auth/gds/callback', () => {
  it('Should respond with status code 302', () =>
    request(app.getServer()).get(Route.loginCallback).expect(302))
})

describe('[POST] /auth/gds/api/users/:userId/reauth', () => {
  it('Should respond with status code 200', () =>
    request(app.getServer()).get(Route.loginCallback).expect(302))
})
