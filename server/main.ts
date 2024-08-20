require("dotenv").config();

import express, { type Application } from "express";
import cors from "cors";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";

import routes from "./routes";

mongoose.connect(process.env.MONGO_URI!); // MongoDB

const app: Application = express();
const server = require("http").createServer(app);

/* Middlewares */
const whitelist = ["https://payrock.me"];
if (process.env.NODE_ENV == "development")
    whitelist.push("http://localhost:3000");

app.use(cors({ origin: whitelist, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api", routes);

// Start the server
server.listen(process.env.PORT, () =>
    console.log(`Payrock Server is running on port ${process.env.PORT}`)
);
