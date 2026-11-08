import { Request, Response } from "express"
import { Types } from "mongoose"
import { CategoryModel } from "../models/category.model"
import { PantryItemModel } from "../models/pantryItem.model"
import { ShoppingListModel } from "../models/shoppingList.model"
import { UserRole } from "../models/user.model"
import { AppError } from "../utils/AppError"
import { getIdParam, getUserId } from "../utils/params"
import { sendSuccess } from "../utils/response"


const isAdmin = (req: Request) => !!req.auth?.roles.includes(UserRole.ADMIN)



//globle , personle categories
export const listCategories = async (req: Request, res: Response) => {
  const userId = new Types.ObjectId(getUserId(req))

  const categories = await CategoryModel.find({ $or: [{ owner: null }, { owner: userId }] })
    .sort({ name: 1 })
    .lean()

  //active items by category
  const counts = await PantryItemModel.aggregate<{ _id: Types.ObjectId; count: number }>([
    { $match: { user: userId, status: "ACTIVE" } },
    { $group: { _id: "$category", count: { $sum: 1 } } }
  ])
  const countMap = new Map(counts.map((c) => [c._id.toString(), c.count]))

  const data = categories.map((c) => ({ ...c, itemCount: countMap.get(c._id.toString()) ?? 0 }))
  return sendSuccess(res, data)
}



// add category
export const createCategory = async (req: Request, res: Response) => {
  const { name, icon, color, isGlobal } = req.body
  const userId = getUserId(req)

  if (isGlobal && !isAdmin(req)) {
    throw new AppError(403, "admins only can create global categories..")
  }

  const category = await CategoryModel.create({
    name,
    icon,
    color,
    owner: isGlobal ? null : new Types.ObjectId(userId)
  })
  return sendSuccess(res, category, "Category created..", 201)
}



//loard to edit
const findEditableCategory = async (req: Request) => {
  const id = getIdParam(req)
  const category = await CategoryModel.findById(id)
  if (!category) throw new AppError(404, "Category not found..")

  if (category.owner === null) {
    if (!isAdmin(req)) throw new AppError(403, "Only admins can modify global categories..")
  } else if (category.owner.toString() !== getUserId(req)) {
    throw new AppError(404, "Category not found..!") 
  }
  return category
}



//update category
export const updateCategory = async (req: Request, res: Response) => {
  const category = await findEditableCategory(req)
  Object.assign(category, req.body)
  await category.save()
  return sendSuccess(res, category, "Category updated..")
}




//delete category
export const deleteCategory = async (req: Request, res: Response) => {
  const category = await findEditableCategory(req)

  const inUse = await PantryItemModel.countDocuments({ category: category._id })
  if (inUse > 0) {
    throw new AppError(409, `Cannot delete: ${inUse} pantry item(s) still use this category..!`)
  }

  // Clear 
  await ShoppingListModel.updateMany(
    { "items.category": category._id },
    { $set: { "items.$[el].category": null } },
    { arrayFilters: [{ "el.category": category._id }] }
  )

  await category.deleteOne()
  return sendSuccess(res, null, "Category deleted..!")
}