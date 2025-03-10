import express from 'express'
import multer from 'multer'
import csv from 'csv-parser'
import fs from 'fs'
import connectDB from '../config/connectdb.js'

const router = express.Router()
const upload = multer({ dest: 'uploads/' })

router.post('/upload', upload.single('file'), async (req, res) => {
  const filePath = req.file.path
  const results = []

  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      const client = await connectDB()
      try {
        for (const row of results) {
          const { category, url, style } = row
          const categoryResult = await client.query(
            'INSERT INTO blog.categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING RETURNING id',
            [category]
          )
          const categoryId = categoryResult.rows[0]?.id

          await client.query(
            'INSERT INTO blog.articles (category_id, title, content, style, url) VALUES ($1, $2, $3, $4, $5)',
            [categoryId, 'Title Placeholder', 'Content Placeholder', style, url]
          )
        }
        res.status(200).send('File uploaded and data inserted successfully')
      } catch (err) {
        console.error('Error inserting data', err)
        res.status(500).send('Error inserting data')
      } finally {
        await client.end()
      }
    })
})

export default router
