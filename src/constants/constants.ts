import dotenv from 'dotenv'

dotenv.config()

export const PORT = process.env.PORT || '3001' as string
export const URL_DATABASE = process.env.URL_DATABASE || 'url de tu base de datos' as string
export const TOKEN_SECRET_KEY = process.env.TOKEN_SECRET_KEY! || 'your secret key' as string
