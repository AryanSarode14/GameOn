import "dotenv/config";
import path from "node:path";
import express from "express";
import session from "express-session";
import passport from "passport";
import { connectDb } from "./db/connection.js";
import authRouter from "./routes/auth.js";
import gamesRouter from "./routes/games.js";
import playerLogsRouter from "./routes/playerLogs.js";

const app = express();
const dist = path.join(import.meta.dirname, "frontend", "dist");

app.set("trust proxy", 1);
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { sameSite: "lax", secure: process.env.NODE_ENV === "production" },
  }),
);
app.use(passport.initialize());
app.use(passport.session());
app.use("/api/auth", authRouter);
app.use("/api/games", gamesRouter);
app.use("/api/playerLogs", playerLogsRouter);
app.use("/api", (req, res) => res.status(404).json({ error: "Not found" }));
app.use(express.static(dist));
app.use((req, res) => res.sendFile(path.join(dist, "index.html")));

const port = process.env.PORT || 3000;
await connectDb();
app.listen(port, () => console.log(`Listening on port ${port}`));
