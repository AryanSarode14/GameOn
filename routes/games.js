import express from "express";
import requireLogin from "../middleware/requireLogin.js";
import { SPORTS, SKILLS, COURTS, NEIGHBORHOODS } from "../db/gameOptions.js";
import { listGames, getGame, createGame, updateGame, deleteGame, popularSlots } from "../db/gamesDB.js";

const router = express.Router();
const isStr = (v) => typeof v === "string";
const isInt = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;
const realDay = (s) => {
  const t = Date.parse(`${s}T00:00:00Z`);
  return !isNaN(t) && new Date(t).toISOString().slice(0, 10) === s;
};
const iso = (v) =>
  isStr(v) &&
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/.test(v) &&
  realDay(v.slice(0, 10)) &&
  !isNaN(Date.parse(v));
const day = (v) => isStr(v) && /^\d{4}-\d{2}-\d{2}$/.test(v) && realDay(v);
const bostonDay = (v) => {
  const tz = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", timeZoneName: "longOffset" })
    .formatToParts(new Date(`${v}T05:00:00Z`))
    .find((p) => p.type === "timeZoneName").value;
  return new Date(`${v}T00:00:00${tz.slice(3)}`);
};
const courtOf = (name) => COURTS.find((c) => c.court === name);
const notFound = (res) => res.status(404).json({ error: "Not found" });
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const hourLabel = (h) => `${h % 12 || 12} ${h < 12 ? "am" : "pm"}`;

const rules = {
  sport: [(v) => SPORTS.includes(v), `Sport must be one of: ${SPORTS.join(", ")}`],
  court: [(v) => !!courtOf(v), "Court must be one of the listed courts"],
  date: [(v) => iso(v) && Date.parse(v) > Date.now(), "Date must be a valid ISO timestamp in the future"],
  skillLevel: [(v) => SKILLS.includes(v), `Skill level must be one of: ${SKILLS.join(", ")}`],
  spotsNeeded: [(v) => isInt(v, 1, 20), "Spots needed must be a whole number from 1 to 20"],
  notes: [(v) => isStr(v) && v.trim().length <= 300, "Notes must be text, up to 300 characters"],
};
const clean = { date: (v) => new Date(v), notes: (v) => v.trim() };

const check = (body, game) => {
  const fields = {};
  const errors = [];
  for (const [k, [ok, msg]] of Object.entries(rules)) {
    const v = body[k];
    if (v === undefined) {
      if (!game && k !== "notes") errors.push(msg);
    } else if (!ok(v)) errors.push(msg);
    else fields[k] = clean[k] ? clean[k](v) : v;
  }
  const sport = body.sport === undefined ? game?.sport : fields.sport;
  const c = courtOf(body.court === undefined ? game?.court : fields.court);
  if ((fields.sport || fields.court) && sport && c && !c.sports.includes(sport))
    errors.push(`${c.court} doesn't offer ${sport}`);
  if (fields.court) fields.neighborhood = c.neighborhood;
  if (!game) fields.notes ??= "";
  return { fields, errors };
};

const checkQuery = ({ sport, neighborhood, skill, from, page = "1" }) => {
  const errors = [];
  if (!isStr(page) || !/^[1-9]\d{0,5}$/.test(page)) errors.push("Page must be a whole number from 1 to 999999");
  if (sport !== undefined && !SPORTS.includes(sport)) errors.push(rules.sport[1]);
  if (neighborhood !== undefined && !NEIGHBORHOODS.includes(neighborhood))
    errors.push(`Neighborhood must be one of: ${NEIGHBORHOODS.join(", ")}`);
  if (skill !== undefined && !SKILLS.includes(skill)) errors.push(rules.skillLevel[1]);
  if (from !== undefined && !iso(from) && !day(from)) errors.push("From must be a date (YYYY-MM-DD) or ISO timestamp");
  const start = from === undefined ? 0 : day(from) ? bostonDay(from) : new Date(from);
  const filters = { sport, neighborhood, skill, from: new Date(Math.max(start, Date.now())) };
  return { filters, page: Number(page), errors };
};

const requireHost = async (req, res, next) => {
  const game = await getGame(req.params.id);
  if (!game) return notFound(res);
  if (!game.hostId.equals(req.user._id)) return res.status(403).json({ error: "Only the host can change this game" });
  req.game = game;
  next();
};

router.get("/options", (req, res) => res.json({ sports: SPORTS, skills: SKILLS, courts: COURTS }));

router.get("/insights", async (req, res) => {
  const { sport } = req.query;
  if (sport && !SPORTS.includes(sport)) return res.status(400).json({ errors: [rules.sport[1]] });
  const { slots, courts, byHour } = await popularSlots(sport);
  res.json({
    slots: slots.map(({ court, neighborhood, day, hour, games }) => ({
      court,
      neighborhood,
      day: DAYS[day - 1],
      hour: hourLabel(hour),
      games,
    })),
    courts: courts.map(({ court, neighborhood, games, spots }) => ({ court, neighborhood, games, spots })),
    byHour: byHour.map(({ hour, games }) => ({ hour: hourLabel(hour), games })),
  });
});

router.get("/", async (req, res) => {
  const { filters, page, errors } = checkQuery(req.query);
  if (errors.length) return res.status(400).json({ errors });
  res.json(await listGames(filters, page));
});

router.get("/:id", async (req, res) => {
  const game = await getGame(req.params.id);
  game ? res.json(game) : notFound(res);
});

router.post("/", requireLogin, async (req, res) => {
  const { fields, errors } = check(req.body ?? {});
  if (errors.length) return res.status(400).json({ errors });
  res.status(201).json(await createGame(req.user, fields));
});

router.put("/:id", requireLogin, requireHost, async (req, res) => {
  const { fields, errors } = check(req.body ?? {}, req.game);
  if (!errors.length && !Object.keys(fields).length) errors.push("No fields to update");
  if (errors.length) return res.status(400).json({ errors });
  const game = await updateGame(req.params.id, fields);
  game ? res.json(game) : notFound(res);
});

router.delete("/:id", requireLogin, requireHost, async (req, res) => {
  (await deleteGame(req.params.id)) ? res.sendStatus(204) : notFound(res);
});

export default router;
