import "./LogForm.css";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { SPORTS, RESULTS } from "../logOptions.js";

const pad = (n) => String(n).padStart(2, "0");
const toLocal = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
const cap = (s) => s[0].toUpperCase() + s.slice(1);
const empty = {
  sport: "",
  date: "",
  location: "",
  durationMin: "",
  result: "",
  rating: "",
  notes: "",
};
const toForm = (l) => ({
  sport: l.sport,
  date: toLocal(new Date(l.date)),
  location: l.location,
  durationMin: String(l.durationMin),
  result: l.result,
  rating: String(l.rating),
  notes: l.notes ?? "",
});

function LogForm() {
  const { id } = useParams();
  const key = id ?? "new";
  const navigate = useNavigate();
  const [loaded, setLoaded] = useState({ key: null, status: "loading" });
  const [draft, setDraft] = useState({ key: null, form: empty });
  const [errors, setErrors] = useState({ key: null, list: [] });
  const [busy, setBusy] = useState(false);
  const alertRef = useRef(null);

  const status = !id ? "ready" : loaded.key === id ? loaded.status : "loading";
  const form = draft.key === key ? draft.form : empty;
  const list = errors.key === key ? errors.list : [];

  useEffect(() => {
    if (errors.key === key && errors.list.length) alertRef.current.focus();
  }, [errors, key]);

  useEffect(() => {
    if (!id) return;
    let ignore = false;
    async function load() {
      try {
        const res = await fetch(`/api/playerLogs/${id}`);
        if (ignore) return;
        if (res.status === 404)
          return setLoaded({ key: id, status: "notFound" });
        if (!res.ok) return setLoaded({ key: id, status: "failed" });
        const log = await res.json();
        if (ignore) return;
        setDraft({ key: id, form: toForm(log) });
        setLoaded({ key: id, status: "ready" });
      } catch {
        if (!ignore) setLoaded({ key: id, status: "failed" });
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [id]);

  if (status === "loading") return <p role="status">Loading…</p>;
  if (status === "notFound")
    return (
      <p>
        Entry not found. <Link to="/log">Back to your log</Link>
      </p>
    );
  if (status === "failed")
    return (
      <p className="alert" role="alert">
        Couldn&apos;t load this entry. <Link to="/log">Back to your log</Link>
      </p>
    );

  function change(e) {
    setDraft({ key, form: { ...form, [e.target.name]: e.target.value } });
  }

  async function submit(e) {
    e.preventDefault();
    const body = {
      ...form,
      date: new Date(form.date).toISOString(),
      durationMin: Number(form.durationMin),
      rating: Number(form.rating),
    };
    setBusy(true);
    setErrors({ key, list: [] });
    try {
      const res = await fetch(
        id ? `/api/playerLogs/${id}` : "/api/playerLogs",
        {
          method: id ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      if (res.ok) return navigate("/log", { replace: true });
      const data = await res.json().catch(() => ({}));
      setErrors({
        key,
        list: data.errors ?? [data.error ?? "Something went wrong. Try again."],
      });
    } catch {
      setErrors({ key, list: ["Couldn't reach the server. Try again."] });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="log-form">
      <h1>{id ? "Edit log entry" : "Log a game"}</h1>
      <form className="log-form-card" onSubmit={submit}>
        <label htmlFor="lf-sport">Sport</label>
        <select
          id="lf-sport"
          name="sport"
          value={form.sport}
          onChange={change}
          required
        >
          <option value="">Choose a sport</option>
          {SPORTS.map((s) => (
            <option key={s} value={s}>
              {cap(s)}
            </option>
          ))}
        </select>

        <label htmlFor="lf-date">Date and time</label>
        <input
          id="lf-date"
          name="date"
          type="datetime-local"
          max={toLocal(new Date())}
          value={form.date}
          onChange={change}
          required
        />

        <label htmlFor="lf-location">Location</label>
        <input
          id="lf-location"
          name="location"
          maxLength={80}
          value={form.location}
          onChange={change}
          required
        />

        <label htmlFor="lf-duration">Duration (minutes)</label>
        <input
          id="lf-duration"
          name="durationMin"
          type="number"
          min="1"
          max="600"
          step="1"
          value={form.durationMin}
          onChange={change}
          required
        />

        <fieldset className="log-form-results">
          <legend>Result</legend>
          {RESULTS.map((r) => (
            <div key={r} className="log-form-radio">
              <input
                id={`lf-result-${r}`}
                type="radio"
                name="result"
                value={r}
                checked={form.result === r}
                onChange={change}
                required
              />
              <label htmlFor={`lf-result-${r}`}>{cap(r)}</label>
            </div>
          ))}
        </fieldset>

        <label htmlFor="lf-rating">Rating (1 to 5)</label>
        <select
          id="lf-rating"
          name="rating"
          value={form.rating}
          onChange={change}
          required
        >
          <option value="">Choose a rating</option>
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>

        <label htmlFor="lf-notes">Notes (optional)</label>
        <textarea
          id="lf-notes"
          name="notes"
          rows={4}
          maxLength={300}
          value={form.notes}
          onChange={change}
        />

        <div className="log-form-actions">
          <button type="submit" disabled={busy}>
            {busy ? "Saving…" : id ? "Save changes" : "Save entry"}
          </button>
          <Link to="/log">Cancel</Link>
        </div>
        {list.length > 0 && (
          <div className="alert" role="alert" tabIndex={-1} ref={alertRef}>
            <ul>
              {list.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </div>
        )}
      </form>
    </div>
  );
}

LogForm.propTypes = {};

export default LogForm;
