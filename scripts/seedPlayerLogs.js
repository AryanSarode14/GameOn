import "dotenv/config";
import { MongoClient } from "mongodb";

const COUNT = 1200;
const DEMO1_LOGS = 300;
const DAYS = 182;
const SPORTS = [
  ["soccer", 30],
  ["basketball", 25],
  ["tennis", 20],
  ["pickleball", 15],
  ["volleyball", 10],
];
const PLACES = {
  soccer: [
    "Joe Moakley Park",
    "LoPresti Park",
    "Franklin Park",
    "Smith Playground",
  ],
  basketball: [
    "Malcolm X Park",
    "Ringer Park",
    "Titus Sparrow Park",
    "Peters Park",
    "Joe Moakley Park",
  ],
  tennis: [
    "Boston Common Tennis Courts",
    "Titus Sparrow Park",
    "Peters Park",
    "Joe Moakley Park",
  ],
  volleyball: ["Carson Beach", "M Street Beach"],
  pickleball: [
    "Peters Park",
    "South Street Courts",
    "Moynihan Recreation Area",
    "Joe Moakley Park",
  ],
};
const NOTES = [
  "Good run, felt sharp",
  "Need to work on my serve",
  "Tired legs today",
  "Close game, came down to the end",
  "Played with a new group",
  "Passing was off",
  "Great defense from everyone",
  "Windy, hard to control the ball",
];

const int = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const weighted = (pairs) => {
  let r = Math.random() * pairs.reduce((s, [, w]) => s + w, 0);
  for (const [v, w] of pairs) if ((r -= w) < 0) return v;
  return pairs.at(-1)[0];
};
const quarter = (lo, hi) => {
  const q = int(lo * 4, hi * 4);
  return [Math.floor(q / 4), (q % 4) * 15];
};
const isWeekend = (d) => d.getDay() === 0 || d.getDay() === 6;

const today = new Date();
const days = Array.from({ length: DAYS }, (_, i) => {
  const d = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() - i - 1,
  );
  return [{ d, ago: i + 1 }, isWeekend(d) ? 2 : 1];
});

const entry = (user, now) => {
  const { d, ago } = weighted(days);
  const [h, m] = isWeekend(d)
    ? quarter(8, 17)
    : Math.random() < 0.85
      ? quarter(17, 20.5)
      : quarter(7, 16.5);
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m);
  const durationMin = int(2, 10) * 15;
  const p = 0.3 + 0.4 * (1 - ago / DAYS);
  const r = Math.random();
  const result = r < p ? "win" : r < p + 0.1 ? "draw" : "loss";
  const rating =
    result === "win"
      ? weighted([
          [3, 20],
          [4, 45],
          [5, 35],
        ])
      : result === "draw"
        ? int(2, 4)
        : weighted([
            [1, 30],
            [2, 45],
            [3, 25],
          ]);
  const sport = weighted(SPORTS);
  const done = date.getTime() + (durationMin + int(60, 360)) * 60000;
  return {
    sport,
    date,
    location: pick(PLACES[sport]),
    durationMin,
    result,
    rating,
    notes: Math.random() < 0.4 ? "" : pick(NOTES),
    userId: user._id,
    createdAt: new Date(Math.min(done, now)),
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
  const now = Date.now();
  const docs = Array.from({ length: COUNT }, (_, i) =>
    entry(
      demo1 && i < DEMO1_LOGS ? demo1 : pick(others.length ? others : users),
      now,
    ),
  );
  const logs = db.collection("playerLogs");
  await logs.deleteMany({});
  const { insertedCount } = await logs.insertMany(docs);
  console.log(`Created ${insertedCount} player logs`);
};

const client = new MongoClient(process.env.MONGO_URI);

try {
  await client.connect();
  await seed(client.db("gameon"));
} finally {
  await client.close();
}
