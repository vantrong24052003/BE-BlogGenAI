import fs from 'fs'
import csv from 'csv-parser'
import { crawlURL } from '../cli/cli.js'

export async function handleFileCSV(csvFile) {
  return new Promise((resolve, reject) => {
    const urls = []
    fs.createReadStream(csvFile)
      .pipe(csv())
      .on('data', (row) => {
        urls.push({ url: row.url, style: row.style, category: row.category })
      })
      .on('end', async () => {
        try {
          const results = await Promise.all(urls.map(({ url, style, category }) => crawlURL(url, style, category)))
          resolve(results)
        } catch (err) {
          reject(err)
        }
      })
      .on('error', (err) => {
        reject(err)
      })
  })
}
