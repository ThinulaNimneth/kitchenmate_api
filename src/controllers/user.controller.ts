import { Request, Response } from "express"
import { Types } from "mongoose"
import { CategoryModel } from "../models/category.model"
import { PantryItemModel } from "../models/pantryItem.model"
import { RecipeModel } from "../models/recipe.model"
import { ShoppingListModel } from "../models/shoppingList.model"
import { UserModel, UserRole } from "../models/user.model"
import { AppError } from "../utils/AppError"
import { escapeRegex, getIdParam, getUserId } from "../utils/params"
import { sendSuccess } from "../utils/response"

//admin user list..
export const listUsers = async (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page) || 1)
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20))
  const search = typeof req.query.search === "string" ? req.query.search.trim() : ""

  const filter = search
    ? {
        $or: [
          { name: { $regex: escapeRegex(search), $options: "i" } },
          { email: { $regex: escapeRegex(search), $options: "i" } }
        ]
      }
    : {}

  const [users, total] = await Promise.all([
    UserModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    UserModel.countDocuments(filter)
  ])

  //user pantry tot.
  const counts = await PantryItemModel.aggregate<{ _id: Types.ObjectId; count: number }>([
    { $match: { user: { $in: users.map((u) => u._id) } } },
    { $group: { _id: "$user", count: { $sum: 1 } } }
  ])
  const countMap = new Map(counts.map((c) => [c._id.toString(), c.count]))

  const data = users.map((u) => ({
    id: u._id.toString(),
    name: u.name,
    email: u.email,
    roles: u.roles,
    isActive: u.isActive,
    createdAt: u.createdAt,
    pantryItemCount: countMap.get(u._id.toString()) ?? 0
  }))

  return sendSuccess(res, data, "OK", 200, { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) })
}

//user rol update dev today here. ....
export const updateUser = async (req: Request, res: Response) => {
  const id = getIdParam(req)
  if (id === getUserId(req)) {
    throw new AppError(400, "You cannot change your own role or status.")
  }

  const user = await UserModel.findByIdAndUpdate(id, req.body, { new: true, runValidators: true })
  if (!user) throw new AppError(404, "User not found..!")


  if (req.body.isActive === false) {
    await UserModel.findByIdAndUpdate(id, { $unset: { refreshTokenHash: 1 } })
  }

  return sendSuccess(
    res,
    { id: user._id.toString(), name: user.name, email: user.email, roles: user.roles, isActive: user.isActive },
    "User updated..!"
  )
}

//user delete
export const deleteUser = async (req: Request, res: Response) => {
  const id = getIdParam(req)
  if (id === getUserId(req)) throw new AppError(400, "You cannot delete your own account..")

  const user = await UserModel.findById(id)
  if (!user) throw new AppError(404, "User not found..!")
  if (user.roles.includes(UserRole.ADMIN)) {
    throw new AppError(400, "Demote the admin to USER before deleting the account")
  }

  await Promise.all([
    PantryItemModel.deleteMany({ user: user._id }),
    ShoppingListModel.deleteMany({ user: user._id }),
    RecipeModel.deleteMany({ user: user._id }),
    CategoryModel.deleteMany({ owner: user._id })
  ])
  await user.deleteOne()

  return sendSuccess(res, null, "User and all related data deleted.")
}
