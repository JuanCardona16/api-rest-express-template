import bcrypt from 'bcrypt'

export const comparePassword = (requestPassword: string, userPasswordInDB: string | any): boolean => {
  return bcrypt.compareSync(requestPassword, userPasswordInDB)
}
