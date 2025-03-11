import connectDB from '../config/connectdb.js'
import { CustomError } from '../constants/custom-error.js'
import { validate as isUUID } from 'uuid'

export const createCategory = async (name) => {
  if (!name) {
    throw new CustomError('Category name is required', 400)
  }

  const dbClient = await connectDB()
  const existingCategory = await dbClient.query(`select id from categories where name = $1`, [name])

  if (existingCategory.rows.length > 0) {
    throw new CustomError('Category already exists', 409)
  }

  const newCategory = await dbClient.query(
    `insert into categories (name) 
     values ($1) returning id`,
    [name]
  )

  return { id: newCategory.rows[0].id, name }
}

export const getAllCategories = async () => {
  const dbClient = await connectDB()
  const categories = await dbClient.query(`select id, name from categories`)
  return categories.rows
}

export const updateCategory = async (id, name) => {
  if (!id || !name) {
    throw new CustomError('Category id and name are required', 400)
  }

  if (!isUUID(id)) {
    throw new CustomError('Invalid Category id format uuid', 400)
  }

  const dbClient = await connectDB()
  const existingCategory = await dbClient.query(`select id from categories where id = $1`, [id])

  if (existingCategory.rows.length === 0) {
    throw new CustomError('Category not found', 404)
  }

  await dbClient.query(`update categories set name = $1, updated_at = now() where id = $2`, [name, id])

  return { id, name }
}

export const deleteCategory = async (id) => {
  if (!id) {
    throw new CustomError('Category id is required', 400)
  }

  if (!isUUID(id)) {
    throw new CustomError('Invalid Category id format uuid', 400)
  }

  const dbClient = await connectDB()
  const existingCategory = await dbClient.query(`select id from categories where id = $1`, [id])

  if (existingCategory.rows.length === 0) {
    throw new CustomError('Category not found', 404)
  }

  await dbClient.query(`delete from categories where id = $1`, [id])

  return {
    message: 'Category deleted successfully'
  }
}

export const saveArticle = async ({ title, content, style, category_name, url }) => {
  if (!title || !content || !style || !url || !category_name) {
    throw new CustomError('Please provide all the required fields', 400)
  }

  try {
    const dbClient = await connectDB()

    const existingCategory = await dbClient.query(`select id from categories where name = $1`, [category_name])

    let categoryId = ''
    if (existingCategory.rows.length > 0) {
      categoryId = existingCategory.rows[0].id
    } else {
      const newCategory = await dbClient.query(
        `insert into categories (name) 
         values ($1) returning id`,
        [category_name]
      )
      categoryId = newCategory.rows[0].id
    }

    await dbClient.query(
      `insert into articles (category_id, title, content, style, url) 
       values ($1, $2, $3, $4, $5)`,
      [categoryId, title, content, style, url]
    )

    console.log('create article successfully!')
  } catch (err) {
    throw new CustomError(err.message, 500)
  }
}
