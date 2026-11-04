import { z } from "zod"

const password = z
  .string()
  .min(4, "password must least 4 characters")
  .max(64)
  .regex(/[A-Za-z]/, " must contain a letter")
  .regex(/[0-9]/, "must contain a number")

export const registerSchema = z.object({
  name: z.string().trim().min(2, "name  at least 2 characters").max(30),
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  password
})

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  password: z.string().min(1, "Password is required")
})

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, "refreshToken is required")
})

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(60)
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: password
})
