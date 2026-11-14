import "dotenv/config";
import { MongoClient } from "mongodb";
import { SKILLS, COURTS } from "../db/gameOptions.js";

const COUNT = 1200;
const DEMO1_GAMES = 20;
const DAYS = 56;
const WEIGHTS = {
  "Carter Playground": 15,
  "Joe Moakley Park": 15,
  "Titus Sparrow Park": 12,
  "Peters Park": 7,
  "Malcolm X Park": 7,
  "Ringer Park": 7,
  "Boston Common Tennis Courts": 6,
  "Moynihan Recreation Area": 6,
};
const REGULARS = [
  { court: "Carter Playground", day: 2, h: 18, m: 0 },
  { court: "Carter Playground", day: 4, h: 18, m: 30 },
  { court: "Joe Moakley Park", day: 6, h: 10, m: 0 },
  { court: "Titus Sparrow Park", day: 3, h: 19, m: 0 },
];
const NOTES = [
  "Friendly pickup game, all welcome",
  "Bring a ball if you have one",
  "Meet by the main entrance",
  "Looking for a competitive game",
  "Casual pace, no pressure",
  "Bring water, no fountain nearby",
  "We play about 90 minutes",
  "New players welcome, we can teach the basics",
];

const int = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const weighted = (pairs) => {
  let r = Math.random() * pairs.reduce((s, [, w]) => s + w, 0);
  for (const [v, w] of pairs) if ((r -= w) < 0) return v;
  return pairs.at(-1)[0];
};
const half = (lo, hi) => {
  const s = int(lo * 2, hi * 2);
  return [Math.floor(s / 2), (s % 2) * 30];
};
const isWeekend = (d) => d.getDay() === 0 || d.getDay() === 6;
const time = (d) => {
  if (isWeekend(d)) return Math.random() < 0.5 ? half(8, 11.5) : half(12, 16.5);
  return Math.random() < 0.85 ? half(17, 20.5) : half(7, 16.5);
};

const today = new Date();
const days = Array.from(
  { length: DAYS },
  (_, i) =>
    new Date(today.getFullYear(), today.getMonth(), today.getDate() + i + 1),
);
const dayPairs = days.map((d) => [d, isWeekend(d) ? 1.5 : 1]);
const courtPairs = COURTS.map((c) => [c, WEIGHTS[c.court] ?? 5]);

const game = (host, now) => {
  let c, d, h, m;
  if (Math.random() < 0.15) {
    const r = pick(REGULARS);
    c = COURTS.find((x) => x.court === r.court);
    d = pick(days.filter((x) => x.getDay() === r.day));
    [h, m] = [r.h, r.m];
  } else {
    c = weighted(courtPairs);
    d = weighted(dayPairs);
    [h, m] = time(d);
  }
  return {
    sport: pick(c.sports),
    court: c.court,
    neighborhood: c.neighborhood,
    date: new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m),
    skillLevel: weighted([
      [SKILLS[0], 25],
      [SKILLS[1], 50],
      [SKILLS[2], 25],
    ]),
    spotsNeeded: int(
      ...weighted([
        [[2, 5], 75],
        [[6, 10], 20],
        [[1, 1], 5],
      ]),
    ),
    notes: Math.random() < 0.4 ? "" : pick(NOTES),
    hostId: host._id,
    hostName: host.username,
    createdAt: now,
  };
};

const seed = async (db) => {
  const users = await db
    .collection("users")
    .find({ username: /^demo\d+$/ })
    .project({ username: 1 })
    .toArray();
  if (!users.length) {
    console.error("Run seedUsers first");
    process.exitCode = 1;
    return;
  }
  const demo1 = users.find((u) => u.username === "demo1");
  const others = users.filter((u) => u !== demo1);
  const now = new Date();
  const docs = Array.from({ length: COUNT }, (_, i) =>
    game(
      demo1 && i < DEMO1_GAMES ? demo1 : pick(others.length ? others : users),
      now,
    ),
  );
  const games = db.collection("games");
  await games.deleteMany({});
  const { insertedCount } = await games.insertMany(docs);
  console.log(`Created ${insertedCount} games`);
};

const client = new MongoClient(process.env.MONGO_URI);

try {
  await client.connect();
  await seed(client.db("gameon"));
} finally {
  await client.close();
}
