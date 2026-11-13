import { ObjectId } from "mongodb";
import { getDb } from "./connection.js";

const per = 20;
let idx;
const logs = async () => {
  const c = getDb().collection("playerLogs");
  idx ??= c.createIndex({ userId: 1, date: -1 }).catch((e) => {
    idx = null;
    throw e;
  });
  await idx;
  return c;
};
const oid = (id) => (/^[0-9a-f]{24}$/i.test(id) ? new ObjectId(id) : null);

export const listLogs = async (userId, { sport, result, from, to }, page) => {
  const q = { userId };
  if (sport) q.sport = sport;
  if (result) q.result = result;
  if (from || to) q.date = { ...(from && { $gte: from }), ...(to && { $lte: to }) };
  const c = await logs();
  const [items, total] = await Promise.all([
    c.find(q).sort({ date: -1, _id: -1 }).skip((page - 1) * per).limit(per).toArray(),
    c.countDocuments(q),
  ]);
  return { items, total, page, totalPages: Math.ceil(total / per) };
};

export const getLog = async (userId, id) => {
  const _id = oid(id);
  return _id && (await logs()).findOne({ _id, userId });
};

export const createLog = async (userId, doc) => {
  const d = { ...doc, userId, createdAt: new Date() };
  const { insertedId } = await (await logs()).insertOne(d);
  return { ...d, _id: insertedId };
};

export const updateLog = async (userId, id, fields) => {
  const _id = oid(id);
  if (!_id) return null;
  return (await logs()).findOneAndUpdate({ _id, userId }, { $set: fields }, { returnDocument: "after" });
};

export const deleteLog = async (userId, id) => {
  const _id = oid(id);
  if (!_id) return false;
  return (await (await logs()).deleteOne({ _id, userId })).deletedCount === 1;
};
