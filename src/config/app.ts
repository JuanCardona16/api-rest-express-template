import "tsconfig-paths/register";
import dotenv from "dotenv";
import express, { RequestHandler } from "express";
import { corsConfig } from "./cors/cors.ts";
import { setHeaders } from "./headers/setHeaders.ts";
import { connectToDb } from "./database/connectDB.ts";
import { handleNotFound } from "./routeNotFound/handleNotFound.ts";
import { errorGlobalHandler } from "./errors/errorGlobalhandler.ts";
import router from "./routes/routes.ts";
import authRoutes from "@/core/authentication/routes/auth.route.ts";

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

const routeApi: RequestHandler = (_req, res, _next) => {
  return res.json({ message: "Hello world!" });
};

const prueba: RequestHandler = (_req, res, _next) => {
  return res.json({ message: "prueba" });
};

// Rutes
// app.use("/", routeApi);
// app.use("/prueba", prueba);
app.use("/api", router);
// app.use("/auth", authRoutes);
app.use("*", handleNotFound);

app._router.stack.forEach(function(r: any){
  if (r.route && r.route.path){
      console.log(r.route.path)
  }
});

export default app;
