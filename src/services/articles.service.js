import connectDB from '../config/connectdb.js'

export const getArticles = async ({ query, category, startDate, endDate, page, limit }) => {
  const dbClient = await connectDB()
  const offset = (page - 1) * limit
  const filters = []
  const values = []

  if (query) {
    filters.push(`(title ilike $${filters.length + 1} OR content ilike $${filters.length + 1})`)
    values.push(`%${query}%`)
  }

  if (category) {
    filters.push(`category_id = $${filters.length + 1}`)
    values.push(category)
  }

  if (startDate) {
    filters.push(`created_at >= $${filters.length + 1}`)
    values.push(startDate)
  }

  if (endDate) {
    filters.push(`created_at <= $${filters.length + 1}`)
    values.push(endDate)
  }

  const whereClause = filters.length > 0 ? `where ${filters.join(' and ')}` : ''
  const articles = await dbClient.query(
    `select id, category_id, title, content, style, url, created_at, updated_at 
     from articles 
     ${whereClause}
     order by created_at desc 
     limit $${filters.length + 1} offset $${filters.length + 2}`,
    [...values, limit, offset]
  )
  const total = await dbClient.query(`select count(*) from articles ${whereClause}`, values)
  return {
    articles: articles.rows,
    total: parseInt(total.rows[0].count, 10),
    page,
    limit
  }
}
