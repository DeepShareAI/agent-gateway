import { createServer } from "node:http";
import { handleRequest } from "./app.js";

createServer(handleRequest).listen(Number(process.env.PORT ?? 8789), "0.0.0.0");
