import "./PlayerLog.css";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import LogFilters from "./LogFilters.jsx";
import LogEntry from "./LogEntry.jsx";
import Pagination from "./Pagination.jsx";

const noFilters = { sport: "", result: "", from: "", to: "" };
const dayStart = (d) => new Date(`${d}T00:00`).toISOString();
const dayEnd = (d) => new Date(`${d}T23:59:59.999`).toISOString();

function PlayerLog() {
  const [filters, setFilters] = useState(noFilters);
  const [page, setPage] = useState(1);
  const [reloads, setReloads] = useState(0);
  const [list, setList] = useState({
    key: null,
    items: [],
    totalPages: 0,
    errors: [],
  });

  const params = {
    sport: filters.sport,
    result: filters.result,
    from: filters.from && dayStart(filters.from),
    to: filters.to && dayEnd(filters.to),
    page: String(page),
  };
  const query = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v),
  ).toString();
  const reqKey = `${query}#${reloads}`;

  useEffect(() => {
    let ignore = false;
    const fail = (errors) =>
      setList({ key: reqKey, items: [], totalPages: 0, errors });
    async function load() {
      try {
        const res = await fetch(`/api/playerLogs?${query}`);
        const data = await res.json().catch(() => ({}));
        if (ignore) return;
        if (!res.ok)
          return fail(
            data.errors ?? [data.error ?? "Couldn't load your log. Try again."],
          );
        if (!data.items.length && page > 1) return setPage(page - 1);
        setList({
          key: reqKey,
          items: data.items,
          totalPages: data.totalPages,
          errors: [],
        });
      } catch {
        if (!ignore) fail(["Couldn't reach the server. Try again."]);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [reqKey, query, page]);

  const loading = list.key !== reqKey;
  const { items, totalPages, errors } = list;
  const filtered = Object.values(filters).some(Boolean);

  function changeFilters(next) {
    setFilters(next);
    setPage(1);
  }

  function changePage(p) {
    setPage(p);
    window.scrollTo(0, 0);
  }

  return (
    <div className="player-log">
      <h1>Player Log</h1>
      <p>Every game you log is private to you.</p>
      <p className="player-log-links">
        <Link to="/log/new" className="player-log-add">
          Add an entry
        </Link>
        <Link to="/log/stats">See my stats</Link>
      </p>

      <LogFilters filters={filters} onChange={changeFilters} />

      {loading && <p role="status">Loading…</p>}
      {errors.length > 0 && (
        <div className="alert" role="alert">
          <ul>
            {errors.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>
      )}
      {!loading && !errors.length && !items.length && (
        <p>
          {filtered
            ? "No entries match these filters."
            : "No entries yet. Log your first game."}
        </p>
      )}
      {items.length > 0 && (
        <ul className="player-log-list" aria-busy={loading}>
          {items.map((e) => (
            <li key={e._id}>
              <LogEntry entry={e} onDelete={() => setReloads((n) => n + 1)} />
            </li>
          ))}
        </ul>
      )}

      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={changePage}
      />
    </div>
  );
}

PlayerLog.propTypes = {};

export default PlayerLog;
