import * as articleService from '../services/articles.service.js'

export const getArticles = async (req, res, next) => {
  try {
    const { query, category, startDate, endDate } = req.query
    const { page = 1, limit = 10 } = req.query

    const result = await articleService.getArticles({ query, category, startDate, endDate, page, limit })
    return res.json(result)
  } catch (error) {
    next(error)
  }
}
