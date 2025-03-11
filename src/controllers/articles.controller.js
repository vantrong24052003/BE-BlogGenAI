import * as articleService from '../services/articles.service.js'

export const getArticles = async (req, res, next) => {
  try {
    const { query, category, startDate, endDate } = req.query
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10

    const result = await articleService.getArticles({ query, category, startDate, endDate, page, limit })
    return res.json(result)
  } catch (error) {
    next(error)
  }
}
