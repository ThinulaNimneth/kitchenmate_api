import { z } from "zod"

export const generateRecipeSchema = z.object({
  days: z.coerce.number().int().min(1).max(14).default(3),
  count: z.coerce.number().int().min(1).max(3).default(2),
  servings: z.coerce.number().int().min(1).max(12).default(2),
  dietary: z.string().trim().max(80).optional(), // e.g. "vegetarian"
  mealType: z.enum(["any", "breakfast", "lunch", "dinner", "snack"]).default("any"),
  itemIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/)).optional()
})

export const saveRecipeSchema = z.object({
  title: z.string().trim().min(2).max(150),
  description: z.string().trim().max(600).default(""),
  prepTimeMinutes: z.coerce.number().min(0).default(0),
  cookTimeMinutes: z.coerce.number().min(0).default(0),
  servings: z.coerce.number().min(1).default(2),
  ingredients: z.array(z.object({ name: z.string().min(1), quantity: z.string().default("") })).default([]),
  pantryStaples: z.array(z.string()).default([]),
  steps: z.array(z.string().min(1)).min(1),
  tip: z.string().max(400).optional()
})
