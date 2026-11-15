import { NextFunction, Request, Response } from "express"
import { UserModel, UserRole } from "../models/user.model"
import { AppError } from "../utils/AppError"
import { verifyAccessToken } from "../utils/token"

//jwt 
export const authenticate = async (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization
  if (!header || !header.startsWith("Bearer ")) {
    throw new AppError(401, "Authentication required..!")
  }


  const payload = verifyAccessToken(header.slice(7))

  //check db stats change
  const user = await UserModel.findById(payload.sub).select("roles isActive")
  if (!user || !user.isActive) {
    throw new AppError(401, "Account not found or deactivated.")
  }

  req.auth = { id: user._id.toString(), roles: user.roles }
  next()
}

//role permission
export const authorize =
  (...allowed: UserRole[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) throw new AppError(401, "Authentication required..!")
    const hasRole = req.auth.roles.some((role) => allowed.includes(role))
    if (!hasRole) {
      throw new AppError(403, "You do not have permission to perform this action..")
    }
    next()
  }
