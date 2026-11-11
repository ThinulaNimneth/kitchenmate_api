import { Document, model, Schema, Types } from "mongoose"
import { UNITS } from "./pantryItem.model"


export interface IShoppingItem {
  name: string
  quantity: number
  unit: (typeof UNITS)[number]
  checked: boolean
  category?: Types.ObjectId | null
}


export interface IShoppingList extends Document {
  user: Types.ObjectId
  name: string
  items: Types.DocumentArray<IShoppingItem>
  isArchived: boolean
  createdAt: Date
  updatedAt: Date
}


