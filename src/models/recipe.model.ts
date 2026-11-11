import { Document, model, Schema, Types } from "mongoose"

export interface IRecipeIngredient {
  name: string
  quantity: string
}



export interface IRecipe extends Document {
  user: Types.ObjectId
  title: string
  description: string
  prepTimeMinutes: number
  cookTimeMinutes: number
  servings: number
  ingredients: IRecipeIngredient[]
  pantryStaples: string[]
  steps: string[]
  tip?: string
  createdAt: Date
  updatedAt: Date
}




const recipeSchema = new Schema<IRecipe>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, default: "", maxlength: 600 },
    prepTimeMinutes: { type: Number, default: 0, min: 0 },
    cookTimeMinutes: { type: Number, default: 0, min: 0 },
    servings: { type: Number, default: 2, min: 1 },
    ingredients: {
      type: [
        {
          _id: false,
          name: { type: String, required: true },
          quantity: { type: String, default: "" }
        }
      ],
      default: []
    },
    pantryStaples: { type: [String], default: [] },
    steps: { type: [String], default: [] },
    tip: { type: String, maxlength: 400 }
  },
  { timestamps: true }
)





export const RecipeModel = model<IRecipe>("Recipe", recipeSchema)