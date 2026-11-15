import { z } from "zod"
import { UNITS } from "../models/pantryItem.model"

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id")

export const createListSchema = z.object({
  name: z.string().trim().min(2).max(80)
})

export const updateListSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  isArchived: z.boolean().optional()
})

export const addListItemSchema = z.object({
  name: z.string().trim().min(1).max(100),
  quantity: z.coerce.number().min(0).default(1),
  unit: z.enum(UNITS).default("pcs"),
  category: objectId.nullable().optional()
})

export const updateListItemSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  quantity: z.coerce.number().min(0).optional(),
  unit: z.enum(UNITS).optional(),
  checked: z.boolean().optional(),
  category: objectId.nullable().optional()
})

//checked itm to pantry
export const moveToPantrySchema = z.object({
  items: z
    .array(
      z.object({
        itemId: objectId,
        category: objectId,
        expirationDate: z.coerce.date({ message: "Invalid date" })
      })
    )
    .min(1, "Select at least one item")
})
