import { z } from "zod"
import { UserRole } from "../models/user.model"

export const adminUpdateUserSchema = z.object({
  roles: z.array(z.nativeEnum(UserRole)).min(1).optional(),
  isActive: z.boolean().optional()
})
