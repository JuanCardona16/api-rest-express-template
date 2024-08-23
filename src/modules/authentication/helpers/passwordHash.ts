import bcrypt from "bcrypt"

export const passwordHash = (password: string, length: number): string => {
  return bcrypt.hashSync(password, length)
}
