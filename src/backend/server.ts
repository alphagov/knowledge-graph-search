import App from './app'
import AuthRoutes from './routes/AuthRoutes'
import IndexRoutes from './routes/IndexRoutes'

const app = new App([new AuthRoutes(), new IndexRoutes()])

app.listen()
