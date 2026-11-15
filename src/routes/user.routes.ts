import { Router } from "express"
import { deleteUser, listUsers, updateUser } from "../controllers/user.controller"
import { authenticate, authorize } from "../middleware/auth.middleware"
import { validateBody } from "../middleware/validate.middleware"
import { UserRole } from "../models/user.model"
import { adminUpdateUserSchema } from "../validators/user.validator"

const router = Router()

//admin acss
router.use(authenticate, authorize(UserRole.ADMIN))

router.get("/", listUsers)
router.patch("/:id", validateBody(adminUpdateUserSchema), updateUser)
router.delete("/:id", deleteUser)

export default router
