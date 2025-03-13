import express from 'express'
import { wrapRequestHandler } from '../constants/wrapper-error.js'
import * as categoryController from '../controllers/categories.controller.js'

const categoriesRouter = express.Router()

categoriesRouter.post('/', wrapRequestHandler(categoryController.createCategory))
categoriesRouter.get('/', wrapRequestHandler(categoryController.getAllCategories))
categoriesRouter.put('/:id', wrapRequestHandler(categoryController.updateCategory))
categoriesRouter.delete('/:id', wrapRequestHandler(categoryController.deleteCategory))

export default categoriesRouter
