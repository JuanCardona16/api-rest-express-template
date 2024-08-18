import jwt from 'jsonwebtoken'
import { TokenPayload } from "./TokenPayload"
import { TOKEN_SECRET_KEY } from '../../../../constants'

export const verifyToken = (token: string): TokenPayload | null => {
  return jwt.verify(token, TOKEN_SECRET_KEY) as TokenPayload
}