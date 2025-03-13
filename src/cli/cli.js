import { Command } from 'commander'
import connectDB from '../config/connectdb.js'
import ora from 'ora'
import chalk from 'chalk'
import { Worker } from 'worker_threads'
import { handleFileCSV } from '../services/csv.service.js'
import { listArticles, exportArticles } from '../services/articles.service.js'
import { scheduleCrawl } from '../services/scheduler.service.js'

const program = new Command()

export const crawlURL = (url, style, category) => {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('../library/worker-threads.js', import.meta.url), {
      workerData: { url, style, category }
    })

    worker.on('message', (message) => {
      if (message.success) {
        resolve(message.url)
      } else {
        reject(new Error(message.error))
      }
    })

    worker.on('error', (err) => {
      reject(err)
    })

    worker.on('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`Worker stopped with exit code ${code}`))
      }
    })
  })
}
// yarn cli:nodemon init
program
  .command('init')
  .description('Initialize configuration and connect to the database')
  .action(async () => {
    const spinner = ora('Waitting...').start()
    try {
      const client = await connectDB()
      spinner.succeed('Database connected successfully')
      await client.end()
    } catch (err) {
      spinner.fail('Failed to connect to the database')
      console.log(chalk.red(err.message))
    }
  })

// yarn cli crawl https://www.npmjs.com/package/np --style formal --category tech
// yarn cli crawl https://portfolio-van-trongs-projects.vercel.app/ https://www.npmjs.com/search?q=keywords:worker_threads https://www.npmjs.com/package/parse-js --style formal --category tech
program
  .command('crawl <urls...>')
  .description('Crawl and display full HTML from a list of URLs')
  .option('--style <style>', 'Style of the article')
  .option('--category <category>', 'Category of the article')
  .action(async (urls, options) => {
    const { style, category } = options
    if (!style || !category) {
      console.log(chalk.red('Please provide all the required fields: style, category'))
      process.exit(1)
    }

    console.log(chalk.redBright(`Starting crawl for [${urls}]`))

    const spinner = ora('Waitting...').start()
    try {
      const results = await Promise.all(urls.map((url) => crawlURL(url, style, category)))
      results.forEach((result) => console.log(chalk.green(`Successfully crawled: ${result}`)))
      spinner.succeed('All process done!')
    } catch (err) {
      console.log(chalk.red(err.message))
    }
  })

// yarn cli:nodemon batch /home/vantrong/Documents/BE-BlogGenAI/src/docs/data.csv
program
  .command('batch <csvFile>')
  .description('Process batch URLs from a CSV file')
  .action(async (csvFile) => {
    const spinner = ora('Waiting...').start()
    try {
      await handleFileCSV(csvFile)
      spinner.succeed('All processes done!')
    } catch (err) {
      console.log(chalk.red(err.message))
    }
  })

// yarn cli:nodemon list
program
  .command('list')
  .description('List all generated articles')
  .action(async () => {
    const spinner = ora('Fetching articles...').start()
    try {
      const articles = await listArticles()
      console.log(chalk.green('Generated Articles:'))
      articles.forEach((article) => console.log(article))
      spinner.succeed('Articles fetched successfully!')
    } catch (err) {
      spinner.fail('Failed to fetch articles')
      console.log(chalk.red(err.message))
    }
  })

// yarn cli export --format=json --output=/home/vantrong/Documents/BE-BlogGenAI/src/docs/articles1.json
program
  .command('export')
  .description('Export articles to a file')
  .option('--format <format>', 'Format of the export file (json|md|html)')
  .option('--output <output>', 'Output file path')
  .action(async (options) => {
    const { format, output } = options
    if (!format || !output) {
      console.log(chalk.red('Please provide all the required fields: format, output'))
      process.exit(1)
    }
    const spinner = ora('Exporting articles...').start()
    try {
      await exportArticles(format, output)
      spinner.succeed('Articles exported successfully!')
    } catch (err) {
      console.log(chalk.red(err.message))
    }
  })

// 0h
// yarn cli schedule --cron="0 0 * * *" --csv=/home/vantrong/Documents/BE-BlogGenAI/src/docs/data.csv
// 2p
// yarn cli schedule --cron="*/2* * * *" --csv=/home/vantrong/Documents/BE-BlogGenAI/src/docs/data.csv
program
  .command('schedule')
  .description('Schedule automatic crawling')
  .option('--cron <cron>', 'Cron expression for scheduling')
  .option('--csv <csv>', 'CSV file path with URLs to crawl')
  .action(async (options) => {
    const { cron, csv } = options
    if (!cron || !csv) {
      console.log(chalk.red('Please provide all the required fields: cron, csv'))
      process.exit(1)
    }
    const spinner = ora('Scheduling crawl...').start()
    try {
      await scheduleCrawl(cron, csv)
      spinner.succeed('Crawl scheduled successfully!')
    } catch (err) {
      console.log(chalk.red(err.message))
    }
  })

program.parse(process.argv)
