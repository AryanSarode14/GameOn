import passport from "passport";
import { Strategy } from "passport-local";
import bcrypt from "bcrypt";
import { findUserByUsername, findUserById } from "../db/usersDB.js";

passport.use(
  new Strategy(async (username, password, done) => {
    try {
      const u = await findUserByUsername(username.toLowerCase());
      if (!u || !(await bcrypt.compare(password, u.passwordHash))) return done(null, false);
      done(null, u);
    } catch (e) {
      done(e);
    }
  }),
);

passport.serializeUser((u, done) => done(null, u._id.toString()));

passport.deserializeUser(async (id, done) => {
  try {
    const u = await findUserById(id);
    done(null, u ? { _id: u._id, username: u.username } : false);
  } catch (e) {
    done(e);
  }
});
