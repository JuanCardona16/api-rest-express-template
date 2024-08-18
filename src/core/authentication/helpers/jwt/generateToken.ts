import jwt from 'jsonwebtoken'
import { TokenPayload } from "./TokenPayload"
import { TOKEN_SECRET_KEY } from '../../../../constants'

export const generateToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, TOKEN_SECRET_KEY, { expiresIn: '1d' })
}
