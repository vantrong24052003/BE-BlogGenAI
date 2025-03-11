import { Command } from 'commander'
import puppeteer from 'puppeteer'
import connectDB from '../config/connectdb.js'
import { generateContent } from '../library/generative-ai.js'
import ora from 'ora'
import chalk from 'chalk'
import { saveArticle } from '../services/categories.service.js'

const program = new Command()

// yarn cli init
program
  .command('init')
  .description('Initialize configuration and connect to the database')
  .action(async () => {
    const spinner = ora('Connecting to the database...').start()
    try {
      const client = await connectDB()
      await client.end()
      spinner.succeed('Database connected successfully')
    } catch (err) {
      spinner.fail('Failed to connect to the database')
      console.log(chalk.red(err.message))
    }
  })

// yarn cli crawl https://portfolio-van-trongs-projects.vercel.app/ --style formal --category tech
program
  .command('crawl <url>')
  .description('Crawl and display full HTML from a URL')
  .option('--style <style>', 'Style of the article')
  .option('--category <category>', 'Category of the article')
  .action(async (url, options) => {
    const { style, category } = options

    const spinner = ora('Crawling the URL...').start()

    try {
      const browser = await puppeteer.launch({ args: ['--no-sandbox'] })
      const page = await browser.newPage()
      try {
        await page.goto(url, { waitUntil: 'load', timeout: 0 })
      } catch (err) {
        spinner.fail('Failed to navigate to the URL. Please check the URL and try again.')
        await browser.close()
        return
      }

      const heading = await page.title()
      const htmlContent = await page.evaluate(() => {
        document.querySelectorAll('script, style, meta').forEach((el) => el.remove())
        return document.body.innerText.trim()
      })

      await browser.close()

      spinner.succeed('Crawl successful! Proceeding to generate content...')
      spinner.start('Generating content...')

      const response = await generateContent(
        `heading:${heading}, style:${style}, category:${category}, htmlContent:${htmlContent}`
      )

      const cleanResponse = response.replace(/```json|```/g, '').trim()
      const parsedResponse = JSON.parse(cleanResponse)
      parsedResponse.url = url

      spinner.succeed('Content generated! Saving to database...')
      spinner.start('Saving to database...')

      await saveArticle(parsedResponse)

      spinner.succeed('Content saved to database successfully!')
    } catch (err) {
      spinner.fail('Error while crawling')
      console.log(chalk.red(err.message))
    }
  })

program.parse(process.argv)
