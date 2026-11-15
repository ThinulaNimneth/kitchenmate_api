import { z } from "zod"
import { ItemStatus, UNITS } from "../models/pantryItem.model"

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id")
const dateInput = z.coerce.date({ message: "Invalid date" })

export const createPantryItemSchema = z.object({
  name: z.string().trim().min(2).max(100),
  category: objectId,
  quantity: z.coerce.number().min(0).default(1),
  unit: z.enum(UNITS).default("pcs"),
  purchaseDate: dateInput.optional(),
  expirationDate: dateInput,
  notes: z.string().trim().max(300).optional()
})

export const updatePantryItemSchema = createPantryItemSchema.partial()

export const updateStatusSchema = z.object({
  status: z.nativeEnum(ItemStatus)
})

export const pantryQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  category: objectId.optional(),
  freshness: z.enum(["fresh", "expiring", "expired"]).optional(),
  status: z.nativeEnum(ItemStatus).default(ItemStatus.ACTIVE),
  sortBy: z.enum(["expirationDate", "name", "createdAt"]).default("expirationDate"),
  order: z.enum(["asc", "desc"]).default("asc"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50)
})
