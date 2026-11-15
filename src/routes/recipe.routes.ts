import { Router } from "express"
import { deleteRecipe, generate, listRecipes, saveRecipe } from "../controllers/recipe.controller"
import { authenticate } from "../middleware/auth.middleware"
import { aiLimiter } from "../middleware/rateLimit.middleware"
import { validateBody } from "../middleware/validate.middleware"
import { generateRecipeSchema, saveRecipeSchema } from "../validators/recipe.validator"

const router = Router()
router.use(authenticate)

router.post("/generate", aiLimiter, validateBody(generateRecipeSchema), generate)
router.get("/", listRecipes)
router.post("/", validateBody(saveRecipeSchema), saveRecipe)
router.delete("/:id", deleteRecipe)

export default router
