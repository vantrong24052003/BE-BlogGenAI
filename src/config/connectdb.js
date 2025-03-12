import pkg from 'pg'
import envConfig from './envconfig.js'
import ora from 'ora'

const { Client } = pkg

const dbConfig = {
  user: envConfig.USER_DB,
  password: envConfig.PASSWORD_DB,
  host: envConfig.HOST_DB,
  port: envConfig.PORT_DB,
  database: 'postgres'
}

const createDatabase = async () => {
  const client = new Client(dbConfig)

  try {
    await client.connect()
    const res = await client.query(`select 1 from pg_database where datname = $1`, [envConfig.NAME_DB])
    if (res.rows.length === 0) {
      await client.query(`create database "${envConfig.NAME_DB}"`)
      console.log(`Database "${envConfig.NAME_DB}" created successfully!`)
    }
  } catch (err) {
    console.log(chalk.red(err.message))
    process.exit(1)
  } finally {
    await client.end()
  }
}

const createSchema = async (client) => {
  const res = await client.query(`
    select schema_name
    from information_schema.schemata
    where schema_name = 'blog'
  `)
  if (res.rows.length === 0) {
    await client.query('create schema blog')
    console.log('Schema "blog" created successfully!')
  }
  await client.query('set search_path to blog, public;')
  await client.query('create extension if not exists "uuid-ossp";')
}

const createCategoriesTable = async (client) => {
  const res = await client.query(`
    select to_regclass('blog.categories')
  `)
  if (res.rows[0].to_regclass === null) {
    await client.query(`
      create table categories (
        id uuid primary key default uuid_generate_v4(),
        name varchar(255) not null unique,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      )
    `)
    console.log('Create table categories successfully')
  }
}

const createArticlesTable = async (client) => {
  const res = await client.query(`
    select to_regclass('blog.articles')
  `)
  if (res.rows[0].to_regclass === null) {
    await client.query(`
      create table articles (
        id uuid primary key default uuid_generate_v4(),
        category_id uuid references categories(id),
        title varchar(255) not null,
        content text not null,
        style varchar(255),
        url text not null,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      )
    `)
    console.log('Create table articles successfully')
  }
}

const connectDB = async () => {
  await createDatabase()
  const client = new Client({
    ...dbConfig,
    database: envConfig.NAME_DB
  })
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
