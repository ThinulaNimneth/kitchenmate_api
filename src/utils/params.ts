import { Request } from "express"
import { AppError } from "./AppError"
import { Types } from "mongoose"


//mongo obj id valid
export const getIdParam = (req: Request, name ="id"): string => {
    const raw = req.params[name]
    const value = Array.isArray(raw) ? raw[0]:raw
    if (!value || !Types.ObjectId.isValid(value)){
        throw new AppError(400, `Invalid ${name}`)
    }
    return value
}

//redos preventt
export const escapeRegex = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

export const getUserId = (req: Request): string => {
  if (!req.auth) throw new AppError(401, "Authentication required")
  return req.auth.id
}