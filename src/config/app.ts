import "tsconfig-paths/register";
import dotenv from "dotenv";
import express from "express";
import { corsConfig } from "./cors/cors.ts";
import { setHeaders } from "./headers/setHeaders.ts";
import { connectToDb } from "./database/connectDB.ts";
import { handleNotFound } from "./routeNotFound/handleNotFound.ts";
import { errorGlobalHandler } from "./errors/errorGlobalhandler.ts";
import router from "./routes/routes.ts";

dotenv.config();

const app = express();

// Coneccion a la base de datos
connectToDb();

app.use(express.json());
app.use(express.urlencoded({ limit: "1mb", extended: true }));

app.use(setHeaders);
app.use(corsConfig());

// Middleware global para manejo de errores
app.use(errorGlobalHandler);

app.disable("x-powered-by");

// Rutes
app.use("/api", router);
app.use("*", handleNotFound);

export default app;
