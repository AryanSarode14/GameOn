import express from "express";
import requireLogin from "../middleware/requireLogin.js";
import {
  listLogs,
  getLog,
  createLog,
  updateLog,
  deleteLog,
} from "../db/playerLogsDB.js";

const router = express.Router();
const sports = ["basketball", "soccer", "tennis", "volleyball", "pickleball"];
const results = ["win", "loss", "draw"];
const isStr = (v) => typeof v === "string";
const isInt = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;
const iso = (v) =>
  isStr(v) && !isNaN(Date.parse(v)) && new Date(v).toISOString() === v;
const len = (v, lo, hi) =>
  isStr(v) && v.trim().length >= lo && v.trim().length <= hi;
const notFound = (res) => res.status(404).json({ error: "Not found" });

const rules = {
  sport: [
    (v) => sports.includes(v),
    `Sport must be one of: ${sports.join(", ")}`,
  ],
  date: [
    (v) => iso(v) && Date.parse(v) <= Date.now() + 5 * 60 * 1000,
    "Date must be a valid ISO timestamp, not in the future",
  ],
  location: [(v) => len(v, 1, 80), "Location must be 1 to 80 characters"],
  durationMin: [
    (v) => isInt(v, 1, 600),
    "Duration must be a whole number from 1 to 600",
  ],
  result: [
    (v) => results.includes(v),
    `Result must be one of: ${results.join(", ")}`,
  ],
  rating: [(v) => isInt(v, 1, 5), "Rating must be a whole number from 1 to 5"],
  notes: [(v) => len(v, 0, 300), "Notes must be text, up to 300 characters"],
};
const clean = {
  date: (v) => new Date(v),
  location: (v) => v.trim(),
  notes: (v) => v.trim(),
};

const check = (body, partial) => {
  const fields = {};
  const errors = [];
  for (const [k, [ok, msg]] of Object.entries(rules)) {
    const v = body[k];
    if (v === undefined) {
      if (!partial && k !== "notes") errors.push(msg);
    } else if (!ok(v)) errors.push(msg);
    else fields[k] = clean[k] ? clean[k](v) : v;
  }
  if (!partial) fields.notes ??= "";
  return { fields, errors };
};

const checkQuery = ({ sport, result, from, to, page = "1" }) => {
  const errors = [];
  if (!isStr(page) || !/^[1-9]\d{0,5}$/.test(page))
    errors.push("Page must be a whole number from 1 to 999999");
  if (sport !== undefined && !sports.includes(sport))
    errors.push(rules.sport[1]);
  if (result !== undefined && !results.includes(result))
    errors.push(rules.result[1]);
  if (from !== undefined && !iso(from))
    errors.push("From must be a valid ISO timestamp");
  if (to !== undefined && !iso(to))
    errors.push("To must be a valid ISO timestamp");
  if (iso(from) && iso(to) && Date.parse(from) > Date.parse(to))
    errors.push("From must not be after To");
  const filters = {
    sport,
    result,
    from: from && new Date(from),
    to: to && new Date(to),
  };
  return { filters, page: Number(page), errors };
};

router.use(requireLogin);

router.get("/", async (req, res) => {
  const { filters, page, errors } = checkQuery(req.query);
  if (errors.length) return res.status(400).json({ errors });
  res.json(await listLogs(req.user._id, filters, page));
});

router.get("/:id", async (req, res) => {
  const log = await getLog(req.user._id, req.params.id);
  log ? res.json(log) : notFound(res);
});

router.post("/", async (req, res) => {
  const { fields, errors } = check(req.body ?? {}, false);
  if (errors.length) return res.status(400).json({ errors });
  res.status(201).json(await createLog(req.user._id, fields));
});

router.put("/:id", async (req, res) => {
  const { fields, errors } = check(req.body ?? {}, true);
  if (!errors.length && !Object.keys(fields).length)
    errors.push("No fields to update");
  if (errors.length) return res.status(400).json({ errors });
  const log = await updateLog(req.user._id, req.params.id, fields);
  log ? res.json(log) : notFound(res);
});

router.delete("/:id", async (req, res) => {
  (await deleteLog(req.user._id, req.params.id))
    ? res.sendStatus(204)
    : notFound(res);
});

export default router;
