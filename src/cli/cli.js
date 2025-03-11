import { Command } from 'commander'
import connectDB from '../config/connectdb.js'
import ora from 'ora'
import chalk from 'chalk'
import { Worker } from 'worker_threads'
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
// yarn cli crawl https://portfolio-van-trongs-projects.vercel.app/ https://www.npmjs.com/search?q=keywords:worker_threads https://www.npmjs.com/package/parse-js --style formal --category tech
program
  .command('crawl <urls...>')
  .description('Crawl and display full HTML from a list of URLs')
  .option('--style <style>', 'Style of the article')
  .option('--category <category>', 'Category of the article')
  .action(async (urls, options) => {
    const { style, category } = options
    console.log(chalk.redBright(`Starting crawl for [${urls}]`))

    const spinner = ora('Waitting...').start()

    const crawlURL = (url) => {
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
          console.log(chalk.red(err.message))
          reject(err)
        })

        worker.on('exit', (code) => {
          if (code !== 0) {
            reject(new Error(`Worker stopped with exit code ${code}`))
          }
        })
      })
    }

    try {
      const results = await Promise.all(urls.map((url) => crawlURL(url)))
      spinner.succeed('end')
    } catch (err) {
      spinner.fail('Error while processing urls')
      console.log(chalk.red(err.message))
    }
  })

program.parse(process.argv)
