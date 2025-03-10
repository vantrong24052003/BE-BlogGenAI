import connectDB from '../config/connectdb.js'

export const saveToDatabase = async ({ title, content, style, category_name, url }) => {
  try {
    const dbClient = await connectDB()

    if (!title || !content || !style || !url || !category_name) {
      console.log('Please provide all the required fields')
      return
    }

    const existingCategory = await dbClient.query(`SELECT id FROM blog.categories WHERE name = $1`, [category_name])

    let categoryId = ''
    if (existingCategory.rows.length > 0) {
      categoryId = existingCategory.rows[0].id
    } else {
      const newCategory = await dbClient.query(
        `INSERT INTO blog.categories (name) 
         VALUES ($1) RETURNING id`,
        [category_name]
      )
      categoryId = newCategory.rows[0].id
    }

    await dbClient.query(
      `INSERT INTO blog.articles (category_id, title, content, style, url) 
       VALUES ($1, $2, $3, $4, $5)`,
      [categoryId, title, content, style, url]
    )

    console.log('create article successfully!')
  } catch (err) {
    console.log(err.message)
  }
}
