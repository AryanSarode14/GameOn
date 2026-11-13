import "./GameCard.css";
import { useState } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";

const cap = (s) => s[0].toUpperCase() + s.slice(1);
const when = (d) =>
  new Date(d).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

function GameCard({ game, isHost, onDelete }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { _id, sport, court, neighborhood, date, skillLevel, spotsNeeded, hostName, notes } = game;
  const title = `${cap(sport)} at ${court}`;

  async function remove() {
    if (!window.confirm("Delete this game?")) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/games/${_id}`, { method: "DELETE" });
      if (res.ok) return onDelete();
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong. Try again.");
    } catch {
      setError("Couldn't reach the server. Try again.");
    }
    setBusy(false);
  }

  return (
    <article className="game-card">
      <h2>{title}</h2>
      <p className="game-card-place">{neighborhood}</p>
      <p>
        <time dateTime={date}>{when(date)}</time>
      </p>
      <p>
        {cap(skillLevel)} · {spotsNeeded} {spotsNeeded === 1 ? "spot" : "spots"} open
      </p>
      <p className="game-card-host">Hosted by {hostName}</p>
      {notes && <p className="game-card-notes">{notes}</p>}
      {isHost && (
        <div className="game-card-actions">
          <Link to={`/games/${_id}/edit`} aria-label={`Edit ${title}`}>Edit</Link>
          <button type="button" onClick={remove} disabled={busy} aria-label={`Delete ${title}`}>
            {busy ? "Deleting…" : "Delete"}
          </button>
        </div>
      )}
      {error && <p className="alert" role="alert">{error}</p>}
    </article>
  );
}

GameCard.propTypes = {
  game: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    sport: PropTypes.string.isRequired,
    court: PropTypes.string.isRequired,
    neighborhood: PropTypes.string.isRequired,
    date: PropTypes.string.isRequired,
    skillLevel: PropTypes.string.isRequired,
    spotsNeeded: PropTypes.number.isRequired,
    hostName: PropTypes.string.isRequired,
    notes: PropTypes.string,
  }).isRequired,
  isHost: PropTypes.bool.isRequired,
  onDelete: PropTypes.func.isRequired,
};

export default GameCard;
