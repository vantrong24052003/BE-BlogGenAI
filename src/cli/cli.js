import { Command } from 'commander'
import puppeteer from 'puppeteer'
import fs from 'fs'
import connectDB from '../config/connectdb.js'
import cron from 'node-cron'
import { generateContent } from '../utils/generative-ai.js'
const program = new Command()

// yarn cli init
program
  .command('init')
  .description('Initialize configuration and connect to the database')
  .action(async () => {
    const client = await connectDB()
    await client.end()
    console.log('Database initialized successfully')
  })

// yarn cli crawl https://portfolio-van-trongs-projects.vercel.app/ --style formal --category tech
program
  .command('crawl <url>')
  .description('Crawl and display full HTML from a URL')
  .option('--style <style>', 'Style of the article')
  .option('--category <category>', 'Category of the article')
  .action(async (url, options) => {
    const { style, category } = options

    try {
      const browser = await puppeteer.launch({ args: ['--no-sandbox'] })
      const page = await browser.newPage()
      await page.goto(url, { waitUntil: 'load', timeout: 0 })

      const title = await page.title()
      const htmlContent = await page.evaluate(() => document.documentElement.outerHTML)

      await browser.close()

      const content = generateContent(`${title} ${style} ${category} ${htmlContent}`)
    } catch (err) {
      console.error('Error while crawling', err)
    }
  })

program
  .command('batch <csvFile>')
  .description('Process batch from a CSV file')
  .action(async (csvFile) => {
    const results = JSON.parse(fs.readFileSync(csvFile, 'utf8'))
    const client = await connectDB()
    try {
      for (const row of results) {
        const { category, url, style } = row
        const browser = await puppeteer.launch({ args: ['--no-sandbox'] })
        const page = await browser.newPage()
        await page.goto(url)

        const title = await page.title()
        const content = await page.evaluate(() => document.body.innerText)

        const categoryResult = await client.query(
          'INSERT INTO blog.categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING RETURNING id',
          [category]
        )
        const categoryId =
          categoryResult.rows[0]?.id ||
          (await client.query('SELECT id FROM blog.categories WHERE name = $1', [category])).rows[0].id

        await client.query(
          'INSERT INTO blog.articles (category_id, title, content, style, url) VALUES ($1, $2, $3, $4, $5)',
          [categoryId, title, content, style, url]
        )

        await browser.close()
      }
      console.log('Batch data inserted successfully')
    } catch (err) {
      console.error('Error inserting data', err)
    } finally {
      await client.end()
    }
  })

program
  .command('list')
  .description('List all created articles')
  .action(async () => {
    const client = await connectDB()
    try {
      const result = await client.query('SELECT * FROM blog.articles')
      console.log('Articles:', result.rows)
    } catch (err) {
      console.error('Error fetching data', err)
    } finally {
      await client.end()
    }
  })

program
  .command('export')
  .description('Export articles to a file')
  .option('--format <format>', 'Format of the export (json|md|html)', 'json')
  .option('--output <output>', 'Output file path', 'exported_articles.json')
  .action(async (options) => {
    const { format, output } = options
    const client = await connectDB()
    try {
      const result = await client.query('SELECT * FROM blog.articles')
      const articles = result.rows

      let data
      if (format === 'json') {
        data = JSON.stringify(articles, null, 2)
      } else if (format === 'md') {
        data = articles.map((article) => `# ${article.title}\n\n${article.content}`).join('\n\n')
      } else if (format === 'html') {
        data = articles.map((article) => `<h1>${article.title}</h1><p>${article.content}</p>`).join('')
      }

      fs.writeFileSync(output, data)
      console.log(`Articles exported to ${output}`)
    } catch (err) {
      console.error('Error exporting data', err)
    } finally {
      await client.end()
    }
  })

program
  .command('schedule')
  .description('Schedule automatic crawling')
  .option('--cron <cron>', 'Cron expression for scheduling', '0 0 * * *')
  .option('--csv <csv>', 'Path to the CSV file')
  .action((options) => {
    const { cron: cronExpression, csv } = options

    cron.schedule(cronExpression, async () => {
      const results = JSON.parse(fs.readFileSync(csv, 'utf8'))
      const client = await connectDB()
      try {
        for (const row of results) {
          const { category, url, style } = row
          const browser = await puppeteer.launch({ args: ['--no-sandbox'] })
          const page = await browser.newPage()
          await page.goto(url)

          const title = await page.title()
          const content = await page.evaluate(() => document.body.innerText)

          const categoryResult = await client.query(
            'INSERT INTO blog.categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING RETURNING id',
            [category]
          )
          const categoryId =
            categoryResult.rows[0]?.id ||
            (await client.query('SELECT id FROM blog.categories WHERE name = $1', [category])).rows[0].id

          await client.query(
            'INSERT INTO blog.articles (category_id, title, content, style, url) VALUES ($1, $2, $3, $4, $5)',
            [categoryId, title, content, style, url]
          )

          await browser.close()
        }
        console.log('Scheduled CSV data inserted successfully')
      } catch (err) {
        console.error('Error inserting data', err)
      } finally {
        await client.end()
      }
    })

    console.log(`Scheduled crawling with cron expression: ${cronExpression}`)
  })

program.parse(process.argv)
