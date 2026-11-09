import { Document, model, Schema, Types } from "mongoose"


export enum ItemStatus {
  ACTIVE = "ACTIVE",
  CONSUMED = "CONSUMED", 
  WASTED = "WASTED" 
}


export const UNITS = [
  "pcs",
  "kg",
  "g",
  "l",
  "ml",
  "pack",
  "can",
  "bottle",
  "box",
  "loaf",
  "dozen"
] as const


export interface IPantryItem extends Document {
  user: Types.ObjectId
  name: string
  category: Types.ObjectId
  quantity: number
  unit: (typeof UNITS)[number]
  purchaseDate: Date
  expirationDate: Date
  notes?: string
  status: ItemStatus
  statusChangedAt?: Date
  createdAt: Date
  updatedAt: Date
}



const pantryItemSchema = new Schema<IPantryItem>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    quantity: { type: Number, required: true, min: 0, default: 1 },
    unit: { type: String, enum: UNITS, default: "pcs" },
    purchaseDate: { type: Date, default: Date.now },
    expirationDate: { type: Date, required: true },
    notes: { type: String, trim: true, maxlength: 300 },
    status: { type: String, enum: Object.values(ItemStatus), default: ItemStatus.ACTIVE },
    statusChangedAt: { type: Date }
  },
  { timestamps: true }
)



// active items by expiry
pantryItemSchema.index({ user: 1, status: 1, expirationDate: 1 })
pantryItemSchema.index({ user: 1, category: 1 })

export const PantryItemModel = model<IPantryItem>("PantryItem", pantryItemSchema)
