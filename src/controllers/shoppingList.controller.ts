import { Request, Response } from "express"
import { Types } from "mongoose"
import { PantryItemModel } from "../models/pantryItem.model"
import { ShoppingListModel } from "../models/shoppingList.model"
import { AppError } from "../utils/AppError"
import { assertCategoryAccessible } from "../utils/ownership"
import { getIdParam, getUserId } from "../utils/params"
import { sendSuccess } from "../utils/response"

//user data
const findMyList = async (req: Request) => {
  const list = await ShoppingListModel.findOne({ _id: getIdParam(req), user: getUserId(req) })
  if (!list) throw new AppError(404, "Shopping list not found..")
  return list
}

//archive list
export const listLists = async (req: Request, res: Response) => {
  const archived = req.query.archived === "true"
  const lists = await ShoppingListModel.find({ user: getUserId(req), isArchived: archived }).sort({
    updatedAt: -1
  })
  return sendSuccess(res, lists)
}

//create
export const createList = async (req: Request, res: Response) => {
  const list = await ShoppingListModel.create({ name: req.body.name, user: getUserId(req) })
  return sendSuccess(res, list, "Shopping list created..!", 201)
}


export const getList = async (req: Request, res: Response) => {
  return sendSuccess(res, await findMyList(req))
}

//update..
export const updateList = async (req: Request, res: Response) => {
  const list = await findMyList(req)
  if (req.body.name !== undefined) list.name = req.body.name
  if (req.body.isArchived !== undefined) list.isArchived = req.body.isArchived
  await list.save()
  return sendSuccess(res, list, "Shopping list updated..")
}

//deleting
export const deleteList = async (req: Request, res: Response) => {
  const list = await findMyList(req)
  await list.deleteOne()
  return sendSuccess(res, null, "Shopping list deleted.")
}

//add itm
export const addItem = async (req: Request, res: Response) => {
  const list = await findMyList(req)
  if (req.body.category) await assertCategoryAccessible(req.body.category, getUserId(req))

  list.items.push(req.body)
  await list.save()
  return sendSuccess(res, list, "Item added to list.", 201)
}

//update
export const updateItem = async (req: Request, res: Response) => {
  const list = await findMyList(req)
  const item = list.items.id(getIdParam(req, "itemId"))
  if (!item) throw new AppError(404, "List item not found..")

  if (req.body.category) await assertCategoryAccessible(req.body.category, getUserId(req))
  item.set(req.body)
  await list.save()
  return sendSuccess(res, list, "Item updated.")
}

//delete
export const deleteItem = async (req: Request, res: Response) => {
  const list = await findMyList(req)
  const itemId = getIdParam(req, "itemId")
  if (!list.items.id(itemId)) throw new AppError(404, "List item not found.")

  list.items.pull({ _id: itemId })
  await list.save()
  return sendSuccess(res, list, "Item removed..!")
}

//chek itm clear
export const clearChecked = async (req: Request, res: Response) => {
  const list = await findMyList(req)
  list.items.pull(...list.items.filter((i) => i.checked).map((i) => ({ _id: i._id })))
  await list.save()
  return sendSuccess(res, list, "Checked items cleared.")
}

//check itm to pantry
export const moveToPantry = async (req: Request, res: Response) => {
  const userId = getUserId(req)
  const list = await findMyList(req)
  const requested: { itemId: string; category: string; expirationDate: Date }[] = req.body.items

  const docs = []
  const movedIds: string[] = []
  for (const entry of requested) {
    const item = list.items.id(entry.itemId)
    if (!item) continue
    await assertCategoryAccessible(entry.category, userId)
    docs.push({
      user: new Types.ObjectId(userId),
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      category: new Types.ObjectId(entry.category),
      purchaseDate: new Date(),
      expirationDate: entry.expirationDate
    })
    movedIds.push(entry.itemId)
  }
  if (docs.length === 0) throw new AppError(404, "None of the selected items were found on this list.")

  const created = await PantryItemModel.insertMany(docs)
  list.items.pull(...movedIds.map((id) => ({ _id: id })))
  await list.save()

  return sendSuccess(res, { moved: created.length, list }, `${created.length} item(s) moved to your pantry..!`)
}
