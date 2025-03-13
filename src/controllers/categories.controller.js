import * as categoryService from '../services/categories.service.js'

export const createCategory = async (req, res, next) => {
  try {
    const { name } = req.body

    const result = await categoryService.createCategory(name)
    return res.json(result)
  } catch (error) {
    next(error)
  }
}

export const getAllCategories = async (req, res, next) => {
  try {
    const result = await categoryService.getAllCategories()
    return res.json(result)
  } catch (error) {
    next(error)
  }
}

export const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params
    const { name } = req.body

    const result = await categoryService.updateCategory(id, name)
    return res.json(result)
  } catch (error) {
    next(error)
  }
}

export const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params

    const result = await categoryService.deleteCategory(id)
    return res.json(result)
  } catch (error) {
    next(error)
  }
}
