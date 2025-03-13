import cron from 'node-cron'
import { handleFileCSV } from './csv.service.js'

export async function scheduleCrawl(cronExpression, csvFile) {
  cron.schedule(cronExpression, async () => {
    try {
      await handleFileCSV(csvFile)
      console.log('Scheduled crawl completed successfully!')
    } catch (err) {
      console.error('Error during scheduled crawl:', err.message)
    }
  })
}
