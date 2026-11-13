import { ObjectId } from "mongodb";
import { getDb } from "./connection.js";

const per = 20;
let idx;
const games = async () => {
  const c = getDb().collection("games");
  idx ??= c.createIndex({ sport: 1, date: 1 }).catch((e) => {
    idx = null;
    throw e;
  });
  await idx;
  return c;
};
const oid = (id) => (/^[0-9a-f]{24}$/i.test(id) ? new ObjectId(id) : null);

export const listGames = async ({ sport, neighborhood, skill, from }, page) => {
  const q = { date: { $gte: from ?? new Date() } };
  if (sport) q.sport = sport;
  if (neighborhood) q.neighborhood = neighborhood;
  if (skill) q.skillLevel = skill;
  const c = await games();
  const [items, total] = await Promise.all([
    c.find(q).sort({ date: 1, _id: 1 }).skip((page - 1) * per).limit(per).toArray(),
    c.countDocuments(q),
  ]);
  return { items, total, page, totalPages: Math.ceil(total / per) };
};

export const getGame = async (id) => {
  const _id = oid(id);
  return _id && (await games()).findOne({ _id });
};

export const createGame = async (user, doc) => {
  const d = { ...doc, hostId: user._id, hostName: user.username, createdAt: new Date() };
  const { insertedId } = await (await games()).insertOne(d);
  return { ...d, _id: insertedId };
};

export const updateGame = async (id, fields) => {
  const _id = oid(id);
  if (!_id) return null;
  return (await games()).findOneAndUpdate({ _id }, { $set: fields }, { returnDocument: "after" });
};

export const deleteGame = async (id) => {
  const _id = oid(id);
  if (!_id) return false;
  return (await (await games()).deleteOne({ _id })).deletedCount === 1;
};
