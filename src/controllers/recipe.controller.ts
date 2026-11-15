import { Request, Response } from "express"
import { Types } from "mongoose"
import { ItemStatus, PantryItemModel } from "../models/pantryItem.model"
import { RecipeModel } from "../models/recipe.model"
import { generateRecipes } from "../services/gemini.service"
import { AppError } from "../utils/AppError"
import { addDays, daysUntil, startOfToday } from "../utils/freshness"
import { getIdParam, getUserId } from "../utils/params"
import { sendSuccess } from "../utils/response"

//recipi ai genete..
export const generate = async (req: Request, res: Response) => {
  const { days, count, servings, dietary, mealType, itemIds } = req.body
  const userId = new Types.ObjectId(getUserId(req))
  const today = startOfToday()

  //load itms 
  const filter: Record<string, unknown> = { user: userId, status: ItemStatus.ACTIVE }
  if (itemIds && itemIds.length > 0) {
    filter._id = { $in: itemIds.map((id: string) => new Types.ObjectId(id)) }
  } else {
    filter.expirationDate = { $gte: today, $lte: addDays(today, days) }
  }

  const items = await PantryItemModel.find(filter).sort({ expirationDate: 1 }).limit(20).lean()
  if (items.length === 0) {
    throw new AppError(
      400,
      `You have no items expiring within ${days} day(s). Add items or increase the number of days..!`
    )
  }

  //send data to ai
  const ingredients = items.map((item) => ({
    name: item.name,
    quantity: item.quantity,
    unit: item.unit,
    daysLeft: daysUntil(item.expirationDate)
  }))
  const recipes = await generateRecipes({ ingredients, count, servings, dietary, mealType })

  return sendSuccess(res, { recipes, basedOn: ingredients }, "Recipes generated.")
}

//save recipi
export const saveRecipe = async (req: Request, res: Response) => {
  const recipe = await RecipeModel.create({ ...req.body, user: getUserId(req) })
  return sendSuccess(res, recipe, "Recipe saved..!", 201)
}

//recipi list.....
export const listRecipes = async (req: Request, res: Response) => {
  const recipes = await RecipeModel.find({ user: getUserId(req) }).sort({ createdAt: -1 })
  return sendSuccess(res, recipes)
}

//remove
export const deleteRecipe = async (req: Request, res: Response) => {
  const recipe = await RecipeModel.findOneAndDelete({ _id: getIdParam(req), user: getUserId(req) })
  if (!recipe) throw new AppError(404, "Recipe not found..")
  return sendSuccess(res, null, "Recipe deleted.")
}
