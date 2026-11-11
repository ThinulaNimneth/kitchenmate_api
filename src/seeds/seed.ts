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


const hash = (plain: string) => bcrypt.hashSync(plain, bcrypt.genSaltSync(10))

const run = async () => {
  await connectDB()


  //admin
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



  //user
  const demoEmail = "demo@kitchenmate.com"
  const demoExists = await UserModel.exists({ email: demoEmail })
  if (!demoExists) {
    await UserModel.create({
      name: "Demo User",
      email: demoEmail,
      password: hash("Demo@12345"),
      roles: [UserRole.USER]
    })
  }



  //categories
  for (const c of GLOBAL_CATEGORIES) {
    await CategoryModel.updateOne(
      { name: c.name, owner: null },
      { $setOnInsert: { ...c, owner: null } },
      { upsert: true }
    )
  }

  console.log("Seed complete..!")
  console.log(`  Admin : ${env.SEED_ADMIN_EMAIL} / ${env.SEED_ADMIN_PASSWORD}`)
  console.log(`  Demo  : ${demoEmail} / Demo@12345`)
}

run()
  .catch((err) => {
    console.error("Seed failed:", err)
    process.exitCode = 1
  })
  .finally(() => mongoose.disconnect())