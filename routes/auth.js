import express from "express";
import bcrypt from "bcrypt";
import passport from "passport";
import { findUserByUsername, createUser } from "../db/usersDB.js";

const router = express.Router();
const pub = (u) => ({ _id: u._id, username: u.username });
const isStr = (v) => typeof v === "string";
const taken = (res) => res.status(409).json({ error: "Username taken" });

router.post("/register", async (req, res, next) => {
  const { username, password } = req.body ?? {};
  const errors = [];
  if (!isStr(username) || !/^[A-Za-z0-9_]{3,20}$/.test(username))
    errors.push("Username must be 3 to 20 letters, numbers or underscores");
  if (
    !isStr(password) ||
    password.length < 6 ||
    Buffer.byteLength(password) > 72
  )
    errors.push("Password must be 6 to 72 characters");
  if (errors.length) return res.status(400).json({ errors });
  const name = username.toLowerCase();
  if (await findUserByUsername(name)) return taken(res);
  let u;
  try {
    u = await createUser(name, await bcrypt.hash(password, 10));
  } catch (e) {
    if (e.code === 11000) return taken(res);
    throw e;
  }
  req.login(u, (err) => (err ? next(err) : res.status(201).json(pub(u))));
});

router.post("/login", (req, res, next) => {
  const { username, password } = req.body ?? {};
  const errors = [];
  if (!isStr(username) || !username) errors.push("Username is required");
  if (!isStr(password) || !password) errors.push("Password is required");
  if (errors.length) return res.status(400).json({ errors });
  passport.authenticate("local", (err, u) => {
    if (err) return next(err);
    if (!u)
      return res.status(401).json({ error: "Wrong username or password" });
    req.login(u, (e) => (e ? next(e) : res.json(pub(u))));
  })(req, res, next);
});

router.post("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy((e) => {
      if (e) return next(e);
      res.clearCookie("connect.sid").sendStatus(204);
    });
  });
});

router.get("/me", (req, res) => res.json(req.user ?? null));

export default router;
