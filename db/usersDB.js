import { ObjectId } from "mongodb";
import { getDb } from "./connection.js";

let idx;
const users = async () => {
  const c = getDb().collection("users");
  idx ??= c.createIndex({ username: 1 }, { unique: true }).catch((e) => {
    idx = null;
    throw e;
  });
  await idx;
  return c;
};

export const findUserByUsername = async (username) => (await users()).findOne({ username });

export const findUserById = async (id) =>
  ObjectId.isValid(id) ? (await users()).findOne({ _id: new ObjectId(id) }) : null;

export const createUser = async (username, passwordHash) => {
  const c = await users();
  const { insertedId } = await c.insertOne({ username, passwordHash, createdAt: new Date() });
  return { _id: insertedId, username };
};
