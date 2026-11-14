import "./LogEntry.css";
import { useState } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";

const cap = (s) => s[0].toUpperCase() + s.slice(1);
const when = (d) =>
  new Date(d).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

function LogEntry({ entry, onDelete }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { _id, sport, date, location, durationMin, result, rating, notes } =
    entry;
  const title = `${cap(sport)} at ${location}`;

  async function remove() {
    if (!window.confirm("Delete this entry?")) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/playerLogs/${_id}`, { method: "DELETE" });
      if (res.ok || res.status === 404) return onDelete();
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong. Try again.");
    } catch {
      setError("Couldn't reach the server. Try again.");
    }
    setBusy(false);
  }

  return (
    <article className="log-entry">
      <h2>{title}</h2>
      <p className="log-entry-when">
        <time dateTime={date}>{when(date)}</time>
      </p>
      <p>
        {durationMin} min ·{" "}
        <span className={`log-entry-result log-entry-${result}`}>
          {cap(result)}
        </span>{" "}
        · Rating {rating}/5
      </p>
      {notes && <p className="log-entry-notes">{notes}</p>}
      <div className="log-entry-actions">
        <Link to={`/log/${_id}/edit`} aria-label={`Edit ${title}`}>
          Edit
        </Link>
        <button
          type="button"
          onClick={remove}
          disabled={busy}
          aria-label={`Delete ${title}`}
        >
          {busy ? "Deleting…" : "Delete"}
        </button>
      </div>
      {error && (
        <p className="alert" role="alert">
          {error}
        </p>
      )}
    </article>
  );
}

LogEntry.propTypes = {
  entry: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    sport: PropTypes.string.isRequired,
    date: PropTypes.string.isRequired,
    location: PropTypes.string.isRequired,
    durationMin: PropTypes.number.isRequired,
    result: PropTypes.string.isRequired,
    rating: PropTypes.number.isRequired,
    notes: PropTypes.string,
  }).isRequired,
  onDelete: PropTypes.func.isRequired,
};

export default LogEntry;
