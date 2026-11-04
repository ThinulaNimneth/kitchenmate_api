import { Request, Response } from "express"
import bcrypt from "bcryptjs"
import { IUser, UserModel, UserRole } from "../models/user.model"
import { AppError } from "../utils/AppError"
import { getUserId } from "../utils/params"
import { sendSuccess } from "../utils/response"
import {
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken
} from "../utils/token"




//password hash refresh
const toUserDTO = (user: IUser) => ({
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    roles: user.roles,
    isActive: user.isActive,
    createdAt: user.createdAt
})


const issueTokens = async(user: IUser) =>{
    const accessToken =  signAccessToken(user)
    const refreshToken = signRefreshToken(user)
    user.refreshTokenHash = hashToken(refreshToken)
    await user.save()
    return{
        accessToken,refreshToken
    }
}



//register

export const register = async (req: Request, res:Response) => {
    const{ name,email,password } = req.body

    const existing = await UserModel.exists({ email })
    if (existing) throw new AppError(409, "user existing...")

    
    //hashing pwd
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password,salt)

    //pub regisist
    const user = await UserModel.create({
        name,
        email,
        password: hashedPassword,
        roles: [UserRole.USER]
    })

    const tokens = await issueTokens(user)
    return sendSuccess( res, { user:toUserDTO(user), ...tokens}, "user registering success...", 201)
}



//login

export const login = async (req: Request , res: Response) => {
    const{ email, password } = req.body

    const user = await UserModel.findOne({email}).select("+password +refreshTokenHash")

    //no user and wrong pass...
    if (!user || !(await bcrypt.compare(password, user.password))) {
        throw new AppError(401 , "invalid credentials...")
    }
    if (!user.isActive) throw new AppError(403, "account has been deactivated...")

    
    const tokens = await issueTokens(user)
    return sendSuccess(res, { user: toUserDTO(user), ...tokens}, "login successful")
}




//refresh tken
export const refresh = async(req: Request, res: Response) => {
    const {refreshToken} = req.body

    //token check expire
    const payload = verifyRefreshToken(refreshToken)

    const user = await UserModel.findById(payload.sub).select("+refreshTokenHash")
    if (!user || !user.isActive) throw new AppError(401, "invalid ref token")

    
    //latest
    if (!user.refreshTokenHash || user.refreshTokenHash !== hashToken(refreshToken)){
        user.refreshTokenHash = undefined
        await user.save()
        throw new AppError(401, " reuse token detect, please log in again")
    }


    const tokens = await issueTokens(user)
    return sendSuccess(res, { user: toUserDTO(user), ...tokens }, "token refreshed...")
}



//logout
export const logout = async(req: Request, res:Response) => {
    await UserModel.findByIdAndUpdate(getUserId(req), { $unset: { refreshTokenHash: 1 }})
    return sendSuccess(res, null, "loging out sucess")
}


//current user
export const me = async (req:Request , res:Response) => {
    const user = await UserModel.findById(getUserId(req))
    if (!user) throw new AppError(404, "user not found...")
    return sendSuccess(res, toUserDTO(user))
}


export const updateProfile = async (req: Request, res: Response) => {
  const user = await UserModel.findByIdAndUpdate(
    getUserId(req),
    { name: req.body.name },
    { new: true, runValidators: true }
  )
  if (!user) throw new AppError(404, "user not found...")
  return sendSuccess(res, toUserDTO(user), "profile updated..")
}



export const changePassword = async (req: Request, res: Response) => {
      const { currentPassword, newPassword } = req.body
  const user = await UserModel.findById(getUserId(req)).select("+password +refreshTokenHash")
  if (!user) throw new AppError(404, "User not found..!")

  if (!(await bcrypt.compare(currentPassword, user.password))) {
    throw new AppError(400, "Current password is incorrect..!")
  }
  

  user.password = await bcrypt.hash(newPassword, await bcrypt.genSalt(10))
  const tokens = await issueTokens(user) 
  return sendSuccess(res, { user: toUserDTO(user), ...tokens }, "Password changed..!")
}