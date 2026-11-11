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


const shoppingItemSchema = new Schema<IShoppingItem>({
  name: { type: String, required: true, trim: true, minlength: 1, maxlength: 100 },
  quantity: { type: Number, default: 1, min: 0 },
  unit: { type: String, enum: UNITS, default: "pcs" },
  checked: { type: Boolean, default: false },
  category: { type: Schema.Types.ObjectId, ref: "Category", default: null }
})




const shoppingListSchema = new Schema<IShoppingList>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    items: { type: [shoppingItemSchema], default: [] },
    isArchived: { type: Boolean, default: false }
  },
  { timestamps: true }
)




export const ShoppingListModel = model<IShoppingList>("ShoppingList", shoppingListSchema)