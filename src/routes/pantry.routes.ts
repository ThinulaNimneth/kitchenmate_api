import { Router } from "express"
import {
  createItem,
  deleteItem,
  getItem,
  listExpiring,
  listItems,
  updateItem,
  updateStatus
} from "../controllers/pantry.controller"
import { authenticate } from "../middleware/auth.middleware"
import { validateBody } from "../middleware/validate.middleware"
import {
  createPantryItemSchema,
  updatePantryItemSchema,
  updateStatusSchema
} from "../validators/pantry.validator"

const router = Router()
router.use(authenticate)

router.get("/", listItems)
router.get("/expiring", listExpiring)
router.post("/", validateBody(createPantryItemSchema), createItem)
router.get("/:id", getItem)
router.put("/:id", validateBody(updatePantryItemSchema), updateItem)
router.patch("/:id/status", validateBody(updateStatusSchema), updateStatus)
router.delete("/:id", deleteItem)

export default router
