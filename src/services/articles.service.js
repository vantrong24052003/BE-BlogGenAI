import connectDB from '../config/connectdb.js'
import fs from 'fs'
import path from 'path'

export const getArticles = async ({ query, category, startDate, endDate, page, limit }) => {
  const client = await connectDB()
  const offset = (page - 1) * limit

  const sqlArticles = `
    SELECT id, category_id, title, content, style, url, created_at, updated_at 
    FROM articles 
    WHERE 
      ($1::text IS NULL OR title ILIKE '%' || $1 || '%' OR content ILIKE '%' || $1 || '%') 
      AND ($2::uuid IS NULL OR category_id = $2::uuid) 
      AND ($3::timestamp IS NULL OR created_at >= $3::timestamp) 
      AND ($4::timestamp IS NULL OR created_at <= $4::timestamp) 
    ORDER BY created_at DESC 
    LIMIT $5 OFFSET $6
  `

  const sqlTotal = `SELECT COUNT(*) FROM articles WHERE 
      ($1::text IS NULL OR title ILIKE '%' || $1 || '%' OR content ILIKE '%' || $1 || '%') 
      AND ($2::uuid IS NULL OR category_id = $2::uuid) 
      AND ($3::timestamp IS NULL OR created_at >= $3::timestamp) 
      AND ($4::timestamp IS NULL OR created_at <= $4::timestamp)`

  const articles = await client.query(sqlArticles, [query, category, startDate, endDate, limit, offset])
  const total = await client.query(sqlTotal, [query, category, startDate, endDate])

  return {
    articles: articles.rows,
    total: total.rows[0].count,
    page,
    limit
  }
}

export const listArticles = async () => {
  const client = await connectDB()
  try {
    const res = await client.query('SELECT * FROM blog.articles')
    return res.rows
  } catch (err) {
    console.log('Error fetching articles', err)
    throw err
  } finally {
    await client.end()
  }
}

export async function exportArticles(format, output) {
  const articles = await getArticles({
    query: null,
    category: null,
    startDate: null,
    endDate: null,
    page: 1,
    limit: 1000
  })
  let content

  switch (format) {
    case 'json':
      content = JSON.stringify(articles.articles, null, 2)
      break
    case 'md':
      content = articles.articles.map((article) => `# ${article.title}\n\n${article.content}`).join('\n\n')
      break
    case 'html':
      content = articles.articles.map((article) => `<h1>${article.title}</h1><p>${article.content}</p>`).join('')
      break
    default:
      throw new Error('Unsupported format')
  }

  fs.writeFileSync(path.resolve(output), content)
}
