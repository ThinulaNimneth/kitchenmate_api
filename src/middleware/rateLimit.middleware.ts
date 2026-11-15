import rateLimit from "express-rate-limit"

const handlerMessage = (message: string) => ({ success: false, message })

//rate limitt
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: handlerMessage("Too many attempts, please try again in 15 minutes.")
})

//ai limit
export const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: (req) => req.auth?.id ?? "anonymous",
  message: handlerMessage("AI recipe limit reached (10 per 15 minutes). Please wait a bit.")
})
