import { Router } from "express"
import {
  addItem,
  clearChecked,
  createList,
  deleteItem,
  deleteList,
  getList,
  listLists,
  moveToPantry,
  updateItem,
  updateList
} from "../controllers/shoppingList.controller"
import { authenticate } from "../middleware/auth.middleware"
import { validateBody } from "../middleware/validate.middleware"
import {
  addListItemSchema,
  createListSchema,
  moveToPantrySchema,
  updateListItemSchema,
  updateListSchema
} from "../validators/shoppingList.validator"



const router = Router()
router.use(authenticate)

router.get("/", listLists)
router.post("/", validateBody(createListSchema), createList)
router.get("/:id", getList)
router.put("/:id", validateBody(updateListSchema), updateList)
router.delete("/:id", deleteList)

router.post("/:id/items", validateBody(addListItemSchema), addItem)
router.put("/:id/items/:itemId", validateBody(updateListItemSchema), updateItem)
router.delete("/:id/items/:itemId", deleteItem)

router.delete("/:id/checked", clearChecked)
router.post("/:id/move-to-pantry", validateBody(moveToPantrySchema), moveToPantry)




export default router
