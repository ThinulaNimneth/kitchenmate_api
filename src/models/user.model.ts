import { Document, model, Schema } from "mongoose";


export enum UserRole {
  ADMIN = "ADMIN",
  USER = "USER"
}

export interface IUser extends Document {
  name: string
  email: string
  password: string
  roles: UserRole[]
  isActive: boolean
  refreshTokenHash?: string
  createdAt: Date
  updatedAt: Date
}

const userSchema = new Schema<IUser>(
    {
        name: {type:String, required:true, trim:true, minlength:2, maxlength:60},
        email: {
            type:String,
            required: true,
            unique : true,
            lowercase: true,
            trim: true
        },

        password: {type: String, required:true, select:false},
        roles: {
            type: [String],
            enum: Object.values(UserRole),
            default: [UserRole.USER]
        },

        isActive: {type:Boolean, default:true},
        refreshTokenHash: {type:String, select: false}
    },
    {timestamps: true}
)


export const UserModel = model<IUser>("User", userSchema)
