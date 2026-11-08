import { Router } from "express"
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory
} from "../controllers/category.controller"
import { authenticate } from "../middleware/auth.middleware"
import { validateBody } from "../middleware/validate.middleware"
import { createCategorySchema, updateCategorySchema } from "../validators/category.validator"

const router = Router()
router.use(authenticate)

router.get("/", listCategories)
router.post("/", validateBody(createCategorySchema), createCategory)
router.put("/:id", validateBody(updateCategorySchema), updateCategory)
router.delete("/:id", deleteCategory)

export default router
