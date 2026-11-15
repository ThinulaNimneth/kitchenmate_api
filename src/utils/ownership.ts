import { Types } from "mongoose"
import { CategoryModel } from "../models/category.model"
import { AppError } from "./AppError"

//user categories pln
export const assertCategoryAccessible = async (categoryId: string, userId: string) => {
  const exists = await CategoryModel.exists({
    _id: categoryId,
    $or: [{ owner: null }, { owner: new Types.ObjectId(userId) }]
  })
  if (!exists) throw new AppError(400, "Selected category does not exist")
}
