import App from './app';
import IndexRoute from './backend/routes/routes';

const app = new App([
  new IndexRoute(),
]);

app.listen();
