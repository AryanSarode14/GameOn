import "dotenv/config";
import bcrypt from "bcrypt";
import { MongoClient } from "mongodb";

const DEMO_PASSWORD = "gameon123";
const COUNT = 20;

const client = new MongoClient(process.env.MONGO_URI);

try {
  await client.connect();
  const users = client.db("gameon").collection("users");
  await users.deleteMany({});
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const createdAt = new Date();
  const docs = Array.from({ length: COUNT }, (_, i) => ({
    username: `demo${i + 1}`,
    passwordHash,
    createdAt,
  }));
  const { insertedCount } = await users.insertMany(docs);
  console.log(`Created ${insertedCount} users`);
} finally {
  await client.close();
}
