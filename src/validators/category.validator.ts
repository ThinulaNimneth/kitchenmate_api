import { z } from "zod"

const hexColor = z.string().regex(/^#([0-9a-fA-F]{6})$/, "Color must be a hex value like #16a34a")

export const createCategorySchema = z.object({
  name: z.string().trim().min(2).max(40),
  icon: z.string().trim().max(8).optional(),
  color: hexColor.optional(),
  
  // admin chek controll
  isGlobal: z.boolean().optional()
})

export const updateCategorySchema = z.object({
  name: z.string().trim().min(2).max(40).optional(),
  icon: z.string().trim().max(8).optional(),
  color: hexColor.optional()
})
