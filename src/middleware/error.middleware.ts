import { NextFunction, Request, Response } from "express"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"
import { ZodError } from "zod"
import { isProduction } from "../config/env"
import { AppError } from "../utils/AppError"

export const notFound = (req: Request, _res: Response, next: NextFunction) => {
  next(new AppError(404, `Route not found: ${req.method} ${req.originalUrl}`))
}

//err manage
export const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  let status = 500
  let message = "Internal server error"
  let details: unknown
  let code: string | undefined

  if (err instanceof AppError) {
    status = err.statusCode
    message = err.message
    details = err.details
    code = err.code
  } else if (err instanceof ZodError) {
    status = 400
    message = "Validation failed"
    details = err.issues.map((issue) => ({ field: issue.path.join("."), message: issue.message }))
  } else if (err instanceof mongoose.Error.ValidationError) {
    status = 400
    message = "Validation failed"
    details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }))
  } else if (err instanceof mongoose.Error.CastError) {
    status = 400
    message = `Invalid value for ${err.path}`
  } else if (err instanceof jwt.TokenExpiredError) {
    status = 401
    message = "Token expired"
    code = "TOKEN_EXPIRED"
  } else if (err instanceof jwt.JsonWebTokenError) {
    status = 401
    message = "Invalid token"
    code = "TOKEN_INVALID"
  } else if (typeof err === "object" && err !== null) {
    const e = err as { code?: number; keyValue?: Record<string, unknown>; type?: string }
    if (e.code === 11000) {
      status = 409
      const field = e.keyValue ? Object.keys(e.keyValue).filter((k) => k !== "owner")[0] : "value"
      message = `Duplicate ${field ?? "value"}: already exists`
    } else if (e.type === "entity.parse.failed") {
      status = 400
      message = "Malformed JSON body"
    }
  }

  if (status === 500) {
    console.error(err)
    if (isProduction) message = "Internal server error"
    else if (err instanceof Error) message = err.message
  }

  res.status(status).json({
    success: false,
    message,
    ...(code ? { code } : {}),
    ...(details ? { details } : {})
  })
}
