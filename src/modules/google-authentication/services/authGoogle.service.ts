import axios from 'axios'
import { googleClient, CLIENT_SECRET, CLIENT_ID, REDIRECT_URI } from '@/constants'


export const getGoogleAuthUrl = () => {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: 'openid profile email',
    access_type: 'offline',
    prompt: 'consent'
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export const getGoogleToken = async (code: string) => {
  const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
    code,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    redirect_uri: REDIRECT_URI,
    grant_type: 'authorization_code'
  })

  const { id_token, access_token } = tokenResponse.data

  return {
    id_token, 
    access_token
  }
}

export const validateGoogleAccessToken = async (idToken: string) => {
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: idToken,
      audience: CLIENT_ID
    });

    return ticket.getPayload();
  } catch (error) {
    console.error('Error al validar el token de acceso:', error);
    throw error;
  }
}

// Obtener informacion del usuario por medio de access_token
export const getUserInfo = async (accessToken: string) => {
  const userInfo = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })
  
  return userInfo.data
}
