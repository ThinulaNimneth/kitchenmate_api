import { NextFunction, Request, Response } from "express"
import { UserModel, UserRole } from "../models/user.model"
import { AppError } from "../utils/AppError"
import { verifyAccessToken } from "../utils/token"


//authentication access tken veryfy
export const authenticate = async (req: Request, _res: Response, next: NextFunction) => {
    const header = req.headers.authorization
    if (!header || !header.startsWith("Bearer ")){
        throw new AppError(401, "authentication need")
    }

    const payload = verifyAccessToken(header.slice(7))

    //db check user deactive
    const user = await UserModel.findById(payload.sub).select("roles isActive")
    if(!user || !user.isActive){
        throw new AppError(401, "account not found")
    }


    req.auth = { id: user._id.toString(), roles: user.roles}
    next()
}


//role based accessing

export const authorize = (...allowed: UserRole[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) throw new AppError(401, "authuntication require")
        
    const hasRole = req.auth.roles.some((role) => allowed.includes(role))
    if (!hasRole) {
      throw new AppError(403, "you dont have permissions...")
    }
    next()
  }