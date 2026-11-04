import { Router } from "express"
import {
  changePassword,
  login,
  logout,
  me,
  refresh,
  register,
  updateProfile
} from "../controllers/auth.controller"
import { authenticate } from "../middleware/auth.middleware"
import { authLimiter } from "../middleware/rateLimit.middleware"
import { validateBody } from "../middleware/validate.middleware"
import {
  changePasswordSchema,
  loginSchema,
  refreshSchema,
  registerSchema,
  updateProfileSchema
} from "../validators/auth.validator"

const router = Router()

router.post("/register", authLimiter, validateBody(registerSchema), register)
router.post("/login", authLimiter, validateBody(loginSchema), login)
router.post("/refresh", authLimiter, validateBody(refreshSchema), refresh)

// protected
router.post("/logout", authenticate, logout)
router.get("/me", authenticate, me)
router.put("/me", authenticate, validateBody(updateProfileSchema), updateProfile)
router.put("/me/password", authenticate, validateBody(changePasswordSchema), changePassword)

export default router
