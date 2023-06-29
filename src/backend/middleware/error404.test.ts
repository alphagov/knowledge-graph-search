import request from 'supertest'
import { expect } from '@jest/globals'
import App from '../app'
import { Route } from '../enums/routes'
import IndexRoute from '../routes/routes'

const indexRoute = new IndexRoute()
const app = new App([indexRoute])

describe('error404', () => {
  it('It should respond with statusCode 404 and display Page not found', () => request(app.getServer())
    .get('/not-a-route')
    .set('user-agent', 'node-superagent')
    .expect(404)
    .then((res) => {
      expect(res.text).toEqual(
        expect.stringContaining('Page not found')
      );
    }));
});
