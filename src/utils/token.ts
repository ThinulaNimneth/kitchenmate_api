import crypto from "crypto"
import jwt from "jsonwebtoken"
import { env } from "../config/env"
import { IUser, UserRole } from "../models/user.model"

export interface TokenPayload {
  sub: string
  roles: UserRole[]
}

//api req tokn accss
export const signAccessToken = (user: IUser): string => {
  return jwt.sign({ sub: user._id.toString(), roles: user.roles }, env.JWT_SECRET, {
    expiresIn: env.ACCESS_TOKEN_EXPIRES_IN as jwt.SignOptions["expiresIn"]
  })
}

// refresh token for new access tokens.
export const signRefreshToken = (user: IUser): string => {
  return jwt.sign(
    { sub: user._id.toString(), roles: user.roles, jti: crypto.randomUUID() },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.REFRESH_TOKEN_EXPIRES_IN as jwt.SignOptions["expiresIn"] }
  )
}

export const verifyAccessToken = (token: string): TokenPayload =>
  jwt.verify(token, env.JWT_SECRET) as unknown as TokenPayload

export const verifyRefreshToken = (token: string): TokenPayload =>
  jwt.verify(token, env.JWT_REFRESH_SECRET) as unknown as TokenPayload

//hashed tokens
export const hashToken = (token: string): string =>
  crypto.createHash("sha256").update(token).digest("hex")
