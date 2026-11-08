import { Document, model, Schema, Types } from "mongoose"


export interface ICategory extends Document {
  name: string
  icon: string
  color: string

  owner: Types.ObjectId | null
  createdAt: Date
  updatedAt: Date
}


const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 40 },
    icon: { type: String, default: "🍽️", maxlength: 8 },
    color: {
      type: String,
      default: "#16a34a",
      match: [/^#([0-9a-fA-F]{6})$/, "color must be a hex value like #16a34a"]
    },
    owner: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true }
  },
  { timestamps: true }
)

//unique name owner

categorySchema.index(
  { owner: 1, name: 1 },
  { unique: true, collation: { locale: "en", strength: 2 } }
)


export const CategoryModel = model<ICategory>("Category", categorySchema)