import { Request, Response } from 'express'
import { getGoogleAuthUrl, getGoogleToken, validateGoogleAccessToken } from '../services/authGoogle.service'

export const redirectToGoogleAuth = (_req: Request, res: Response) => {
  const authURL = getGoogleAuthUrl()
  res.redirect(authURL)
}

export const handleGoogleCallback = async (req: Request, res: Response): Promise<void> => {
  const code = req.query.code as string

  try {
    const { id_token } = await getGoogleToken(code);

    const userInfo = await validateGoogleAccessToken(id_token)

    console.log(userInfo)

    res.json({
      userInfo
    })
  } catch (error) {
    res.status(500).json({ error: 'Hubo un error al obtener o validar el token de acceso. ' + error })
  }
}
