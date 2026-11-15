

import bcrypt from "bcryptjs"
import mongoose from "mongoose"
import { connectDB } from "../config/db"
import { env } from "../config/env"
import { CategoryModel } from "../models/category.model"
import { UserModel, UserRole } from "../models/user.model"


const GLOBAL_CATEGORIES = [
  { name: "Dairy & Eggs", icon: "🥛", color: "#3b82f6" },
  { name: "Fruits & Vegetables", icon: "🥦", color: "#16a34a" },
  { name: "Meat & Fish", icon: "🍗", color: "#ef4444" },
  { name: "Bakery", icon: "🍞", color: "#d97706" },
  { name: "Pantry Staples", icon: "🥫", color: "#a16207" },
  { name: "Frozen", icon: "🧊", color: "#06b6d4" },
  { name: "Beverages", icon: "🧃", color: "#8b5cf6" },
  { name: "Snacks & Sweets", icon: "🍪", color: "#ec4899" },
  { name: "Other", icon: "🍽️", color: "#64748b" }
]

//use 10 salt round
const hash = (plain: string) => bcrypt.hashSync(plain, bcrypt.genSaltSync(10))

const run = async () => {
  await connectDB()

  //admin create
  await UserModel.findOneAndUpdate(
    { email: env.SEED_ADMIN_EMAIL },
    {
      $setOnInsert: {
        name: "KitchenMate Admin",
        email: env.SEED_ADMIN_EMAIL,
        password: hash(env.SEED_ADMIN_PASSWORD),
        roles: [UserRole.ADMIN, UserRole.USER]
      }
    },
    { upsert: true }
  )

  //all user standard category
  for (const c of GLOBAL_CATEGORIES) {
    await CategoryModel.updateOne(
      { name: c.name, owner: null },
      { $setOnInsert: { ...c, owner: null } },
      { upsert: true, collation: { locale: "en", strength: 2 } }
    )
  }

  console.log("Seed complete..!")
  console.log(`  Admin email : ${env.SEED_ADMIN_EMAIL}`)
  console.log("  Admin password: the value of SEED_ADMIN_PASSWORD in your .env")
}

run()
  .catch((err) => {
    console.error("Seed failed:", err)
    process.exitCode = 1
  })
  .finally(() => mongoose.disconnect())