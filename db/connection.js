import { MongoClient } from "mongodb";

export const client = new MongoClient(process.env.MONGO_URI);

export const connectDb = () => client.connect();
export const getDb = () => client.db("gameon");
