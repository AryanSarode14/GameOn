import "./GameBoard.css";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useUser } from "../context/UserContext.jsx";
import GameFilters from "./GameFilters.jsx";
import GameCard from "./GameCard.jsx";
import Pagination from "./Pagination.jsx";

const noFilters = { sport: "", neighborhood: "", skill: "", from: "" };

function GameBoard() {
  const { user } = useUser();
  const [options, setOptions] = useState(null);
  const [optionsFailed, setOptionsFailed] = useState(false);
  const [filters, setFilters] = useState(noFilters);
  const [page, setPage] = useState(1);
  const [reloads, setReloads] = useState(0);
  const [result, setResult] = useState({ key: null, items: [], totalPages: 0, errors: [] });

  const query = new URLSearchParams(Object.entries({ ...filters, page: String(page) }).filter(([, v]) => v)).toString();
  const reqKey = `${query}#${reloads}`;

  useEffect(() => {
    let ignore = false;
    fetch("/api/games/options")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((o) => !ignore && setOptions(o))
      .catch(() => !ignore && setOptionsFailed(true));
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;
    const fail = (errors) => setResult({ key: reqKey, items: [], totalPages: 0, errors });
    async function load() {
      try {
        const res = await fetch(`/api/games?${query}`);
        const data = await res.json().catch(() => ({}));
        if (ignore) return;
        if (!res.ok) return fail(data.errors ?? [data.error ?? "Couldn't load games. Try again."]);
        if (!data.items.length && page > 1) return setPage(page - 1);
        setResult({ key: reqKey, items: data.items, totalPages: data.totalPages, errors: [] });
      } catch {
        if (!ignore) fail(["Couldn't reach the server. Try again."]);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [reqKey, query, page]);

  const loading = result.key !== reqKey;
  const { items, totalPages, errors } = result;

  function changeFilters(next) {
    setFilters(next);
    setPage(1);
  }

  function changePage(p) {
    setPage(p);
    window.scrollTo(0, 0);
  }

  return (
    <div className="game-board">
      <h1>Game Board</h1>
      <p>Find a pickup game near you, or post your own.</p>
      <p className="game-board-links">
        <Link to="/games/new" className="game-board-post">Post a game</Link>
        <Link to="/games/insights">Popular times</Link>
      </p>

      {options && <GameFilters filters={filters} options={options} onChange={changeFilters} />}
      {optionsFailed && <p className="alert" role="alert">Couldn&apos;t load the filters. Try again.</p>}

      {loading && <p role="status">Loading…</p>}
      {errors.length > 0 && (
        <div className="alert" role="alert">
          <ul>{errors.map((m) => <li key={m}>{m}</li>)}</ul>
        </div>
      )}
      {!loading && !errors.length && !items.length && <p>No upcoming games match these filters.</p>}
      {items.length > 0 && (
        <ul className="game-board-list" aria-busy={loading}>
          {items.map((g) => (
            <li key={g._id}>
              <GameCard game={g} isHost={user?._id === g.hostId} onDelete={() => setReloads((n) => n + 1)} />
            </li>
          ))}
        </ul>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={changePage} />
    </div>
  );
}

GameBoard.propTypes = {};

export default GameBoard;
