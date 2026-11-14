import "./GameInsights.css";
import { useEffect, useRef, useState } from "react";
import Chart from "chart.js/auto";

const PLURAL = {
  Sun: "Sundays",
  Mon: "Mondays",
  Tue: "Tuesdays",
  Wed: "Wednesdays",
  Thu: "Thursdays",
  Fri: "Fridays",
  Sat: "Saturdays",
};
const cap = (s) => s[0].toUpperCase() + s.slice(1);
const cssVar = (name) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();

function GameInsights() {
  const [sports, setSports] = useState(null);
  const [optionsFailed, setOptionsFailed] = useState(false);
  const [sport, setSport] = useState("");
  const [result, setResult] = useState({
    key: null,
    slots: [],
    courts: [],
    byHour: [],
    errors: [],
  });
  const canvasRef = useRef(null);

  const query = sport ? `?${new URLSearchParams({ sport })}` : "";

  useEffect(() => {
    let ignore = false;
    fetch("/api/games/options")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((o) => !ignore && setSports(o.sports))
      .catch(() => !ignore && setOptionsFailed(true));
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;
    const fail = (errors) =>
      setResult({ key: sport, slots: [], courts: [], byHour: [], errors });
    async function load() {
      try {
        const res = await fetch(`/api/games/insights${query}`);
        const data = await res.json().catch(() => ({}));
        if (ignore) return;
        if (!res.ok)
          return fail(
            data.errors ?? [
              data.error ?? "Couldn't load popular times. Try again.",
            ],
          );
        setResult({
          key: sport,
          slots: data.slots,
          courts: data.courts,
          byHour: data.byHour,
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
  }, [sport, query]);

  const loading = result.key !== sport;
  const { slots, courts, byHour, errors } = result;

  useEffect(() => {
    if (!byHour.length) return;
    const text = cssVar("--text");
    const grid = cssVar("--border");
    const chart = new Chart(canvasRef.current, {
      type: "bar",
      data: {
        labels: byHour.map((h) => h.hour),
        datasets: [
          {
            label: "Games",
            data: byHour.map((h) => h.games),
            backgroundColor: cssVar("--accent"),
          },
        ],
      },
      options: {
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: text }, grid: { color: grid } },
          y: {
            beginAtZero: true,
            ticks: { color: text, precision: 0 },
            grid: { color: grid },
          },
        },
      },
    });
    return () => chart.destroy();
  }, [byHour]);

  const top = slots[0];
  const peak = byHour.reduce((a, b) => (b.games > a.games ? b : a), byHour[0]);
  const chartLabel =
    peak &&
    `Bar chart of games by hour of day. Busiest hour: ${peak.hour}, ${peak.games} ${peak.games === 1 ? "game" : "games"}.`;

  return (
    <div className="game-insights">
      <h1>Popular Times</h1>

      {sports && (
        <form
          className="game-insights-filter"
          role="search"
          aria-label="Choose a sport"
          onSubmit={(e) => e.preventDefault()}
        >
          <label htmlFor="insights-sport">Sport</label>
          <select
            id="insights-sport"
            value={sport}
            onChange={(e) => setSport(e.target.value)}
          >
            <option value="">All</option>
            {sports.map((s) => (
              <option key={s} value={s}>
                {cap(s)}
              </option>
            ))}
          </select>
        </form>
      )}
      {optionsFailed && (
        <p className="alert" role="alert">
          Couldn&apos;t load the sports list. Try again.
        </p>
      )}

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
      {!loading && !errors.length && !slots.length && (
        <p>{sport ? "No games yet for this sport." : "No games yet."}</p>
      )}

      {top && (
        <div className="game-insights-content" aria-busy={loading}>
          <p className="game-insights-answer">
            Busiest{sport && ` for ${sport}`}: {top.court} on {PLURAL[top.day]}{" "}
            at {top.hour}.
          </p>

          <section className="game-insights-chart" aria-labelledby="gi-hours">
            <h2 id="gi-hours">Games by hour of day</h2>
            <div className="game-insights-canvas">
              <canvas ref={canvasRef} role="img" aria-label={chartLabel} />
            </div>
          </section>

          <div className="game-insights-tables">
            <section aria-labelledby="gi-courts">
              <h2 id="gi-courts">Most active courts</h2>
              <div
                className="game-insights-scroll"
                role="region"
                aria-labelledby="gi-courts"
                tabIndex={0}
              >
                <table aria-labelledby="gi-courts">
                  <thead>
                    <tr>
                      <th scope="col">Court</th>
                      <th scope="col">Neighborhood</th>
                      <th scope="col" className="num">
                        Games
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {courts.map((c) => (
                      <tr key={c.court}>
                        <td>{c.court}</td>
                        <td>{c.neighborhood}</td>
                        <td className="num">{c.games}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section aria-labelledby="gi-slots">
              <h2 id="gi-slots">Best time slots</h2>
              <div
                className="game-insights-scroll"
                role="region"
                aria-labelledby="gi-slots"
                tabIndex={0}
              >
                <table aria-labelledby="gi-slots">
                  <thead>
                    <tr>
                      <th scope="col">Day</th>
                      <th scope="col">Time</th>
                      <th scope="col">Court</th>
                      <th scope="col" className="num">
                        Games
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {slots.map((s) => (
                      <tr key={`${s.court}-${s.day}-${s.hour}`}>
                        <td>{s.day}</td>
                        <td className="time">{s.hour}</td>
                        <td>{s.court}</td>
                        <td className="num">{s.games}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}

GameInsights.propTypes = {};

export default GameInsights;
