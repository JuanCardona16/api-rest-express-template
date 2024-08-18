import mongoose from "mongoose"
import { URL_DATABASE } from "../../constants"

export const connectToDb = async () => {
  try {
    await mongoose.connect(URL_DATABASE as string)
    console.log(`Connected to database established!`)
  } catch (error) {
    console.log(`Error connecting to database. Error: ${error}`)
    mongoose.disconnect()
    throw new Error(error as string)
  }
}