import pkg from 'pg'
import envConfig from './enconfig.js'

const { Client } = pkg

const dbConfig = {
  user: envConfig.USER_DB,
  password: envConfig.PASSWORD_DB,
  host: envConfig.HOST_DB,
  port: envConfig.PORT_DB,
  database: envConfig.NAME_DB
}

const connectDB = async () => {
  const client = new Client(dbConfig)
  try {
    await client.connect()
    console.log('Connected to PostgreSQL database')

    // Set the default schema to 'blog'
    await client.query('SET search_path TO blog')
    console.log('Schema set to blog')

    // Execute SQL queries here
    const result = await client.query('SELECT * FROM employees')
    console.log('Query result:', result.rows)

    // Close the connection when done
    await client.end()
    console.log('Connection to PostgreSQL closed')

    return result.rows
  } catch (err) {
    console.error('Error connecting to PostgreSQL database', err)
    process.exit(1)
  }
}

export default connectDB
