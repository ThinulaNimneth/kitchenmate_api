import { Response } from "express"

//succ response all
export const sendSuccess = <T>(
  res: Response,
  data: T,
  message = "OK",
  statusCode = 200,
  meta?: Record<string, unknown>
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    ...(meta ? { meta } : {})
  })
}
