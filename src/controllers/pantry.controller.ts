import { Request, Response } from "express"
import { Types } from "mongoose"
import { env } from "../config/env"
import { ItemStatus, PantryItemModel } from "../models/pantryItem.model"
import { AppError } from "../utils/AppError"
import { addDays, startOfToday, withFreshness } from "../utils/freshness"
import { assertCategoryAccessible } from "../utils/ownership"
import { escapeRegex, getIdParam, getUserId } from "../utils/params"
import { sendSuccess } from "../utils/response"
import { pantryQuerySchema } from "../validators/pantry.validator"

const CATEGORY_FIELDS = "name icon color"

//itms filter
export const listItems = async (req: Request, res: Response) => {
  const q = pantryQuerySchema.parse(req.query)
  const userId = new Types.ObjectId(getUserId(req))

  const filter: Record<string, unknown> = { user: userId, status: q.status }
  if (q.category) filter.category = new Types.ObjectId(q.category)
  if (q.search) filter.name = { $regex: escapeRegex(q.search), $options: "i" }

  //new and expire date filter
  const today = startOfToday()
  const soonEnd = addDays(today, env.EXPIRING_SOON_DAYS)
  if (q.freshness === "expired") filter.expirationDate = { $lt: today }
  if (q.freshness === "expiring") filter.expirationDate = { $gte: today, $lte: soonEnd }
  if (q.freshness === "fresh") filter.expirationDate = { $gt: soonEnd }

  const sortDir = q.order === "asc" ? 1 : -1
  const [items, total] = await Promise.all([
    PantryItemModel.find(filter)
      .populate("category", CATEGORY_FIELDS)
      .sort({ [q.sortBy]: sortDir, _id: 1 })
      .skip((q.page - 1) * q.limit)
      .limit(q.limit)
      .lean(),
    PantryItemModel.countDocuments(filter)
  ])

  return sendSuccess(res, items.map(withFreshness), "OK", 200, {
    page: q.page,
    limit: q.limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / q.limit))
  })
}

//expires 
export const listExpiring = async (req: Request, res: Response) => {
  const days = Math.min(30, Math.max(1, Number(req.query.days) || env.EXPIRING_SOON_DAYS))
  const includeExpired = req.query.includeExpired === "true"
  const today = startOfToday()

  const items = await PantryItemModel.find({
    user: new Types.ObjectId(getUserId(req)),
    status: ItemStatus.ACTIVE,
    expirationDate: includeExpired
      ? { $lte: addDays(today, days) }
      : { $gte: today, $lte: addDays(today, days) }
  })
    .populate("category", CATEGORY_FIELDS)
    .sort({ expirationDate: 1 })
    .lean()

  return sendSuccess(res, items.map(withFreshness))
}



export const getItem = async (req: Request, res: Response) => {
  const item = await PantryItemModel.findOne({ _id: getIdParam(req), user: getUserId(req) })
    .populate("category", CATEGORY_FIELDS)
    .lean()
  if (!item) throw new AppError(404, "Pantry item not found..!")
  return sendSuccess(res, withFreshness(item))
}

//create
export const createItem = async (req: Request, res: Response) => {
  const userId = getUserId(req)
  await assertCategoryAccessible(req.body.category, userId)

  const created = await PantryItemModel.create({ ...req.body, user: userId })
  const item = await PantryItemModel.findById(created._id).populate("category", CATEGORY_FIELDS).lean()
  return sendSuccess(res, withFreshness(item!), "Item added to pantry..!", 201)
}


//update
export const updateItem = async (req: Request, res: Response) => {
  const userId = getUserId(req)
  if (req.body.category) await assertCategoryAccessible(req.body.category, userId)

  const item = await PantryItemModel.findOneAndUpdate(
    { _id: getIdParam(req), user: userId },
    req.body,
    { new: true, runValidators: true }
  )
    .populate("category", CATEGORY_FIELDS)
    .lean()
  if (!item) throw new AppError(404, "Pantry item not found..!")
  return sendSuccess(res, withFreshness(item), "Item updated..!")
}

//stats
export const updateStatus = async (req: Request, res: Response) => {
  const status: ItemStatus = req.body.status
  const update =
    status === ItemStatus.ACTIVE
      ? { status, $unset: { statusChangedAt: 1 } }
      : { status, statusChangedAt: new Date() }

  const item = await PantryItemModel.findOneAndUpdate(
    { _id: getIdParam(req), user: getUserId(req) },
    update,
    { new: true }
  )
    .populate("category", CATEGORY_FIELDS)
    .lean()
  if (!item) throw new AppError(404, "Pantry item not found..!")

  const labels: Record<ItemStatus, string> = {
    [ItemStatus.ACTIVE]: "Item restored to pantry..!",
    [ItemStatus.CONSUMED]: "Marked as used - nice, no waste!",
    [ItemStatus.WASTED]: "Marked as wasted..!"
  }
  return sendSuccess(res, withFreshness(item), labels[status])
}

//delete..
export const deleteItem = async (req: Request, res: Response) => {
  const item = await PantryItemModel.findOneAndDelete({ _id: getIdParam(req), user: getUserId(req) })
  if (!item) throw new AppError(404, "Pantry item not found..!")
  return sendSuccess(res, null, "Item deleted..!")
}
