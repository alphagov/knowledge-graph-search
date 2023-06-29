import App from './app'
import AuthRoutes from './routes/AuthRoutes'
import IndexRoutes from './routes/IndexRoutes'
import ErrorRoutes from './routes/ErrorRoutes'

const app = new App([new AuthRoutes(), new IndexRoutes(), new ErrorRoutes()])

app.listen()
