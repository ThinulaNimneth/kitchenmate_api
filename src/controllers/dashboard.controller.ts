import { Request, Response } from "express"
import { Types } from "mongoose"
import { env } from "../config/env"
import { CategoryModel } from "../models/category.model"
import { ItemStatus, PantryItemModel } from "../models/pantryItem.model"
import { RecipeModel } from "../models/recipe.model"
import { ShoppingListModel } from "../models/shoppingList.model"
import { addDays, startOfToday, withFreshness } from "../utils/freshness"
import { getUserId } from "../utils/params"
import { sendSuccess } from "../utils/response"

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

//dashbord analy
export const getStats = async (req: Request, res: Response) => {
  const userId = new Types.ObjectId(getUserId(req))
  const today = startOfToday()
  const soonEnd = addDays(today, env.EXPIRING_SOON_DAYS)
  const active = { user: userId, status: ItemStatus.ACTIVE }

  //six month last
  const windowStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 5, 1))

  const [expired, expiring, fresh, byCategory, monthlyRaw, expiringSoon, openLists, savedRecipes] =
    await Promise.all([
      PantryItemModel.countDocuments({ ...active, expirationDate: { $lt: today } }),
      PantryItemModel.countDocuments({ ...active, expirationDate: { $gte: today, $lte: soonEnd } }),
      PantryItemModel.countDocuments({ ...active, expirationDate: { $gt: soonEnd } }),

      PantryItemModel.aggregate<{ name: string; icon: string; color: string; count: number }>([
        { $match: active },
        { $group: { _id: "$category", count: { $sum: 1 } } },
        {
          $lookup: { from: CategoryModel.collection.name, localField: "_id", foreignField: "_id", as: "cat" }
        },
        { $unwind: "$cat" },
        { $project: { _id: 0, name: "$cat.name", icon: "$cat.icon", color: "$cat.color", count: 1 } },
        { $sort: { count: -1 } }
      ]),

      PantryItemModel.aggregate<{ _id: { y: number; m: number; status: string }; count: number }>([
        {
          $match: {
            user: userId,
            status: { $in: [ItemStatus.CONSUMED, ItemStatus.WASTED] },
            statusChangedAt: { $gte: windowStart }
          }
        },
        {
          $group: {
            _id: { y: { $year: "$statusChangedAt" }, m: { $month: "$statusChangedAt" }, status: "$status" },
            count: { $sum: 1 }
          }
        }
      ]),

      PantryItemModel.find({ ...active, expirationDate: { $lte: soonEnd } })
        .populate("category", "name icon color")
        .sort({ expirationDate: 1 })
        .limit(6)
        .lean(),

      ShoppingListModel.countDocuments({ user: userId, isArchived: false }),
      RecipeModel.countDocuments({ user: userId })
    ])

  // zero to fil miss months
  const monthly = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - (5 - i), 1))
    const y = d.getUTCFullYear()
    const m = d.getUTCMonth() + 1
    const find = (status: ItemStatus) =>
      monthlyRaw.find((r) => r._id.y === y && r._id.m === m && r._id.status === status)?.count ?? 0
    return { month: `${MONTHS[m - 1]}`, year: y, consumed: find(ItemStatus.CONSUMED), wasted: find(ItemStatus.WASTED) }
  })

  const totalConsumed = monthly.reduce((sum, m) => sum + m.consumed, 0)
  const totalWasted = monthly.reduce((sum, m) => sum + m.wasted, 0)
  const handled = totalConsumed + totalWasted

  return sendSuccess(res, {
    totals: { active: expired + expiring + fresh, fresh, expiring, expired },
    byCategory,
    monthly,
    wasteSummary: {
      consumed: totalConsumed,
      wasted: totalWasted,
      //used and wate...
      savedRate: handled === 0 ? null : Math.round((totalConsumed / handled) * 100)
    },
    expiringSoon: expiringSoon.map(withFreshness),
    openShoppingLists: openLists,
    savedRecipes
  })
}
