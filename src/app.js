import express from 'express'
import bodyParser from 'body-parser'
import connectDB from './config/connectdb.js'
import envConfig from './config/envconfig.js'
import errorHandler from './constants/error-handler.js'
import { limiter } from './library/rate-limit.js'
import categoriesRouter from './routes/categories.js'
import articlesRouter from './routes/articles.js'

const app = express()

app.use(bodyParser.json())

const startServer = async () => {
  try {
    await connectDB()
    app.use(limiter)
    app.use('/api/categories', categoriesRouter)
    app.use('/api/articles', articlesRouter)
    // default error handler
    app.use(errorHandler)
    app.listen(envConfig.PORT, () => console.log('Server running http://localhost:' + envConfig.PORT))
  } catch (err) {
    console.log('Error starting server:', err)
  }
}

startServer()
