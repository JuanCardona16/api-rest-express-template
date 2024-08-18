import mongoose, { Schema } from "mongoose"
import { Collection } from "@/constants"

// Definimos una función llamada getModel que recibe un nombre de colección y un esquema (schema).
export const getModel = (collectionName: Collection, schema: Schema) => {
  // Esto asocia un nombre de colección y un esquema, permitiendo interactuar con la base de datos.
  return mongoose.model(collectionName, schema)
}
