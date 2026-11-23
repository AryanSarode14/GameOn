import "dotenv/config";
import path from "node:path";
import express from "express";
import session from "express-session";
import MongoStore from "connect-mongo";
import passport from "passport";
import "./auth/passport.js";
import { client, connectDb } from "./db/connection.js";
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
    store: MongoStore.create({ client, dbName: "gameon" }),
    cookie: {
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  }),
);
app.use(passport.initialize());
app.use(passport.session());
app.use("/api/auth", authRouter);
app.use("/api/games", gamesRouter);
app.use("/api/playerLogs", playerLogsRouter);
app.use("/api", (req, res) => res.status(404).json({ error: "Not found" }));
app.use("/api", (err, req, res, next) => {
  if (res.headersSent) return next(err);
  if (err.type === "entity.parse.failed")
    return res.status(400).json({ error: "Request body must be valid JSON" });
  console.error(err);
  res.status(500).json({ error: "Something went wrong. Try again." });
});
app.use(express.static(dist));
app.use((req, res) => res.sendFile(path.join(dist, "index.html")));

const port = process.env.PORT || 3000;
await connectDb();
app.listen(port, () => console.log(`Listening on port ${port}`));
