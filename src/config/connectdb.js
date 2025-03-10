import pkg from 'pg'
import envConfig from './envconfig.js'

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

    await client.query('CREATE SCHEMA IF NOT EXISTS blog')

    await client.query('SET search_path TO blog, public;')

    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')

    await client.query(`
      CREATE TABLE IF NOT EXISTS blog.categories (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL UNIQUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS blog.articles (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        category_id UUID REFERENCES blog.categories(id),
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        style VARCHAR(255),
        url TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)

    return client
  } catch (err) {
    console.error('Error connecting to PostgreSQL database', err)
    process.exit(1)
  }
}

export default connectDB
