import express from 'express'
import bodyParser from 'body-parser'
import connectDB from './config/connectdb.js'
import envConfig from './config/enconfig.js'
import errorHandler from './middlewares/error-handler.js'

const app = express()

app.use(bodyParser.json())

const startServer = async () => {
  try {
    const queryResult = await connectDB()
    console.log('Query result from connectDB:', queryResult)

    // Default error handler
    app.use(errorHandler)

    app.listen(envConfig.PORT, () => console.log('Server running http://localhost:' + envConfig.PORT))
  } catch (err) {
    console.error('Error starting server:', err)
  }
}

startServer()
