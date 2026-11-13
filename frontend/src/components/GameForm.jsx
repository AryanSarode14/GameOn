import "./GameForm.css";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useUser } from "../context/UserContext.jsx";

const pad = (n) => String(n).padStart(2, "0");
const toLocalInput = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
const cap = (s) => s[0].toUpperCase() + s.slice(1);
const empty = { sport: "", court: "", date: "", skillLevel: "", spotsNeeded: "", notes: "" };
const toForm = ({ sport, court, date, skillLevel, spotsNeeded, notes }) => ({
  sport,
  court,
  date: toLocalInput(new Date(date)),
  skillLevel,
  spotsNeeded: String(spotsNeeded),
  notes: notes ?? "",
});

function GameForm() {
  const { id } = useParams();
  const { user } = useUser();
  const navigate = useNavigate();
  const [options, setOptions] = useState(null);
  const [form, setForm] = useState(empty);
  const [status, setStatus] = useState("loading");
  const [loadedFor, setLoadedFor] = useState(null);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState([]);
  const alertRef = useRef(null);

  useEffect(() => {
    if (errors.length) alertRef.current.focus();
  }, [errors]);

  useEffect(() => {
    let ignore = false;
    const done = (s) => {
      setLoadedFor(id ?? "new");
      setStatus(s);
    };
    async function load() {
      try {
        const [optRes, gameRes] = await Promise.all([
          fetch("/api/games/options"),
          id ? fetch(`/api/games/${id}`) : null,
        ]);
        if (ignore) return;
        if (gameRes?.status === 404) return done("notFound");
        if (!optRes.ok || (gameRes && !gameRes.ok)) return done("failed");
        const [opts, game] = await Promise.all([optRes.json(), gameRes?.json()]);
        if (ignore) return;
        if (game && game.hostId !== user._id) return done("notHost");
        setOptions(opts);
        setForm(game ? toForm(game) : empty);
        setErrors([]);
        done("ready");
      } catch {
        if (!ignore) done("failed");
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [id, user._id]);

  if (status === "loading" || loadedFor !== (id ?? "new")) return <p role="status">Loading…</p>;
  if (status === "notFound") return <p>Game not found. <Link to="/games">Back to games</Link></p>;
  if (status === "notHost") return <p>Only the host can edit this game. <Link to="/games">Back to games</Link></p>;
  if (status === "failed") return <p className="alert" role="alert">Couldn&apos;t load this page. Try again.</p>;

  const courts = options.courts.filter((c) => c.sports.includes(form.sport));
  const hoods = [...new Set(courts.map((c) => c.neighborhood))];
  const min = toLocalInput(new Date());
  const submitLabel = busy ? "Saving…" : id ? "Save changes" : "Post game";

  function change(e) {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      const fits = options.courts.some((c) => c.court === prev.court && c.sports.includes(value));
      if (name === "sport" && !fits) next.court = "";
      return next;
    });
  }

  async function submit(e) {
    e.preventDefault();
    const body = { ...form, date: new Date(form.date).toISOString(), spotsNeeded: Number(form.spotsNeeded) };
    setBusy(true);
    setErrors([]);
    try {
      const res = await fetch(id ? `/api/games/${id}` : "/api/games", {
        method: id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) return navigate("/games", { replace: true });
      const data = await res.json().catch(() => ({}));
      setErrors(data.errors ?? [data.error ?? "Something went wrong. Try again."]);
    } catch {
      setErrors(["Couldn't reach the server. Try again."]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="game-form">
      <h1>{id ? "Edit game" : "Post a game"}</h1>
      <form className="game-form-card" onSubmit={submit}>
        <label htmlFor="gf-sport">Sport</label>
        <select id="gf-sport" name="sport" value={form.sport} onChange={change} required>
          <option value="">Choose a sport</option>
          {options.sports.map((s) => <option key={s} value={s}>{cap(s)}</option>)}
        </select>

        <label htmlFor="gf-court">Court</label>
        <select id="gf-court" name="court" value={form.court} onChange={change} disabled={!form.sport} required>
          <option value="">{form.sport ? "Choose a court" : "Choose a sport first"}</option>
          {hoods.map((n) => (
            <optgroup key={n} label={n}>
              {courts.filter((c) => c.neighborhood === n).map((c) => (
                <option key={c.court} value={c.court}>{c.court}</option>
              ))}
            </optgroup>
          ))}
        </select>

        <label htmlFor="gf-date">Date and time</label>
        <input id="gf-date" name="date" type="datetime-local" min={min} value={form.date} onChange={change} required />

        <fieldset>
          <legend>Skill level</legend>
          {options.skills.map((s) => (
            <div key={s} className="game-form-radio">
              <input id={`gf-skill-${s}`} type="radio" name="skillLevel" value={s}
                checked={form.skillLevel === s} onChange={change} required />
              <label htmlFor={`gf-skill-${s}`}>{cap(s)}</label>
            </div>
          ))}
        </fieldset>

        <label htmlFor="gf-spots">Spots needed</label>
        <input id="gf-spots" name="spotsNeeded" type="number" min="1" max="20" step="1"
          value={form.spotsNeeded} onChange={change} required />

        <label htmlFor="gf-notes">Notes (optional)</label>
        <textarea id="gf-notes" name="notes" rows={4} maxLength={300} value={form.notes} onChange={change} />

        <div className="game-form-actions">
          <button type="submit" disabled={busy}>{submitLabel}</button>
          <Link to="/games">Cancel</Link>
        </div>
        {errors.length > 0 && (
          <div className="alert" role="alert" tabIndex={-1} ref={alertRef}>
            <ul>{errors.map((m) => <li key={m}>{m}</li>)}</ul>
          </div>
        )}
      </form>
    </div>
  );
}

GameForm.propTypes = {};

export default GameForm;
