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

const createDatabase = async () => {
  const client = new Client(dbConfig)

  try {
    await client.connect()
    const res = await client.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [envConfig.NAME_DB])
    if (res.rows.length === 0) {
      await client.query(`CREATE DATABASE "${envConfig.NAME_DB}"`)
      console.log(`Database "${envConfig.NAME_DB}" created successfully!`)
    }
  } catch (err) {
    console.log('Error creating database', err)
    process.exit(1)
  } finally {
    await client.end()
  }
}

const createSchema = async (client) => {
  await client.query('CREATE SCHEMA IF NOT EXISTS blog')
  await client.query('SET search_path TO blog, public;')
  await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')
}

const createCategoriesTable = async (client) => {
  await client.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name VARCHAR(255) NOT NULL UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
}

const createArticlesTable = async (client) => {
  await client.query(`
    CREATE TABLE IF NOT EXISTS articles (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      category_id UUID REFERENCES categories(id),
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      style VARCHAR(255),
      url TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
}

const connectDB = async () => {
  await createDatabase()
  const client = new Client(dbConfig)
  try {
    await client.connect()
    await createSchema(client)
    await createCategoriesTable(client)
    await createArticlesTable(client)
    return client
  } catch (err) {
    console.log('Error connecting to PostgreSQL database', err)
    process.exit(1)
  }
}

export default connectDB
