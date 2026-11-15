import { Router } from "express"
import authRoutes from "./auth.routes"
import categoryRoutes from "./category.routes"
import dashboardRoutes from "./dashboard.routes"
import pantryRoutes from "./pantry.routes"
import recipeRoutes from "./recipe.routes"
import shoppingListRoutes from "./shoppingList.routes"
import userRoutes from "./user.routes"

const router = Router()

router.get("/health", (_req, res) => {
  res.json({ success: true, message: "KitchenMate API is running", timestamp: new Date().toISOString() })
})

router.use("/auth", authRoutes)
router.use("/users", userRoutes)
router.use("/categories", categoryRoutes)
router.use("/pantry", pantryRoutes)
router.use("/shopping-lists", shoppingListRoutes)
router.use("/recipes", recipeRoutes)
router.use("/dashboard", dashboardRoutes)

export default router
