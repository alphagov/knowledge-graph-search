import fs from 'fs'
import path from 'path'
import * as http from 'http';
import cors from 'cors';
import express from 'express'
import Routes from './interfaces/routes.interface';
import * as nunjucks from 'nunjucks'
import bodyParser from 'body-parser'

const views = [
  path.join(__dirname, '../node_modules/govuk-frontend/'),
  path.join(__dirname, '../node_modules/govuk-frontend/components'),
  //path.join(__dirname, './views'),
  path.join(__dirname, '../src'),
  path.join(__dirname, '../src/views'),
];

class App {

  public app: express.Express = express();
  public port: (string | number);

  constructor(routes: Routes[]) {
    this.app = express();
    this.port = process.env.port ? parseInt(process.env.port) : 8080;

    this.initializeMiddlewares();
    this.initializeRoutes(routes);
    this.initializeRenderEngine();
  }

  public listen(): void {
    const server = http.createServer(this.app);
    server.keepAliveTimeout = 1000 * (60 * 6); // 6 minutes
    server.listen(this.port, () => {
      console.log(`🚀 App listening on the port ${this.port}`);
    });
  }


  private initializeMiddlewares() {
    this.app.use(cors())
    this.app.use(express.static('public'))
    this.app.use(bodyParser.urlencoded({ extended: true }));
    this.app.use(bodyParser.json());
  }

  private initializeRoutes(routes: Routes[]) {
    routes.forEach((route) => {
      this.app.use('/', route.router);
    });
  }

  private initializeRenderEngine() {
    nunjucks.configure(views, {
      autoescape: true,
      express: this.app,
    });
    this.app.engine('html', nunjucks.render);
    this.app.set('views', views);
    this.app.set('view engine', 'html');
  }


}

export default App;
