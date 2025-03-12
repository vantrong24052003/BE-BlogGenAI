import { parentPort, workerData } from 'worker_threads'
import puppeteer from 'puppeteer'
import { generateContent } from '../library/generative-ai.js'
import { saveArticle } from '../services/categories.service.js'
import chalk from 'chalk'

if (!workerData || !workerData.url || !workerData.style || !workerData.category) {
  parentPort.postMessage({ success: false, error: 'Please provide all the required fields: url, style, category' })
  process.exit(1)
}

const { url, style, category } = workerData
console.log('🚀 ~ workerData:', workerData)

export async function crawHtml() {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] })
  const page = await browser.newPage()

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 0 })
    console.log(chalk.blueBright(`Crawling ${url}`))
    console.log('-----------------Crawling successfully-----------------')

    const heading = await page.title()
    // tiền xử lý
    const htmlContent = await page.evaluate(() => {
      document.querySelectorAll('script, style, meta').forEach((el) => el.remove())
      return document.body.innerText.trim()
    })

    const response = await generateContent(
      `heading:${heading}, style:${style}, category:${category}, htmlContent:${htmlContent}`
    )

    const cleanResponse = response.replace(/```json|```/g, '').trim()
    const parsedResponse = JSON.parse(cleanResponse)
    parsedResponse.url = url

    await saveArticle(parsedResponse)

    parentPort.postMessage({ success: true, url })
  } catch (error) {
    parentPort.postMessage({ success: false, url, error: error.message })
  } finally {
    await browser.close()
  }
}

crawHtml()
