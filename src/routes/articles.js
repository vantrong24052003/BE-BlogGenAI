import express from 'express'
import { wrapRequestHandler } from '../constants/wrapper-error.js'
import * as articleController from '../controllers/articles.controller.js'
const articlesRouter = express.Router()

articlesRouter.get('/', wrapRequestHandler(articleController.getArticles))

export default articlesRouter
