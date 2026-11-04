import rateLimit from "express-rate-limit"

const handlerMessage = (message: string) => ({ success: false, message})


export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: handlerMessage("try again ")
})


//gemini limit
export const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: (req) => req.auth?.id ?? "anonymous",
  message: handlerMessage("ai limited please wait...")
})