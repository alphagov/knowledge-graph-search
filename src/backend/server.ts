import App from './app'
import IndexRoute from './routes/routes'

const app = new App([new IndexRoute()])

app.listen()
