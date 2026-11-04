import type { UserRole } from "../models/user.model";


export interface AuthContext{
    id: string
    roles: UserRole[]
}


declare global{
    namespace Express{
        interface Request {
            auth?: AuthContext
        }
    }
}