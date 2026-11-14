import "./PlayerStats.css";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Chart from "chart.js/auto";

const cap = (s) => s[0].toUpperCase() + s.slice(1);
const cssVar = (name) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();
const monthName = (m, withYear, style = "long") => {
  const [y, mo] = m.split("-").map(Number);
  return new Date(y, mo - 1, 1).toLocaleString(undefined, {
    month: style,
    ...(withYear && { year: "numeric" }),
  });
};
const spansYears = (months) =>
  months[0].month.slice(0, 4) !== months.at(-1).month.slice(0, 4);
const summary = (months) => {
  const first = months[0];
  const last = months.at(-1);
  if (months.length === 1)
    return `Your win rate in ${monthName(last.month)} is ${last.winRate}%.`;
  const yr = spansYears(months);
  return `Win rate went from ${first.winRate}% in ${monthName(first.month, yr)} to ${last.winRate}% in ${monthName(last.month, yr)}.`;
};

function PlayerStats() {
  const [state, setState] = useState({
    status: "loading",
    data: null,
    error: "",
  });
  const canvasRef = useRef(null);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const res = await fetch("/api/playerLogs/stats");
        const data = await res.json().catch(() => ({}));
        if (ignore) return;
        if (!res.ok)
          return setState({
            status: "failed",
            data: null,
            error: data.error ?? "Couldn't load your stats. Try again.",
          });
        setState({ status: "ready", data, error: "" });
      } catch {
        if (!ignore)
          setState({
            status: "failed",
            data: null,
            error: "Couldn't reach the server. Try again.",
          });
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, []);

  const { status, data, error } = state;

  useEffect(() => {
    if (!data?.totals.games) return;
    const months = data.byMonth;
    const yr = spansYears(months);
    const text = cssVar("--text");
    const grid = cssVar("--border");
    const chart = new Chart(canvasRef.current, {
      type: "bar",
      data: {
        labels: months.map((m) => monthName(m.month, yr, "short")),
        datasets: [
          {
            type: "line",
            label: "Win rate",
            data: months.map((m) => m.winRate),
            borderColor: text,
            backgroundColor: text,
            yAxisID: "y1",
            order: 0,
          },
          {
            label: "Hours played",
            data: months.map((m) => m.hours),
            backgroundColor: cssVar("--accent"),
            yAxisID: "y",
            order: 1,
          },
        ],
      },
      options: {
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: text } },
          tooltip: {
            callbacks: {
              label: (c) =>
                c.dataset.yAxisID === "y1"
                  ? `Win rate: ${c.parsed.y}%`
                  : `Hours played: ${c.parsed.y}`,
            },
          },
        },
        scales: {
          x: { ticks: { color: text }, grid: { color: grid } },
          y: {
            beginAtZero: true,
            title: { display: true, text: "Hours", color: text },
            ticks: { color: text },
            grid: { color: grid },
          },
          y1: {
            position: "right",
            min: 0,
            max: 100,
            title: { display: true, text: "Win rate", color: text },
            ticks: { color: text, callback: (v) => `${v}%` },
            grid: { drawOnChartArea: false },
          },
        },
      },
    });
    return () => chart.destroy();
  }, [data]);

  const t = data?.totals;
  const tiles = t && [
    ["Games", t.games],
    ["Win rate", `${t.winRate}%`],
    ["Hours played", t.hours],
    ["Average rating", `${t.avgRating}/5`],
  ];

  return (
    <div className="player-stats">
      <h1>My Stats</h1>
      {status === "loading" && <p role="status">Loading…</p>}
      {status === "failed" && (
        <p className="alert" role="alert">
          {error}
        </p>
      )}
      {status === "ready" && !t.games && (
        <p>
          Log a few games to see your stats.{" "}
          <Link to="/log/new">Log a game</Link>
        </p>
      )}
      {status === "ready" && t.games > 0 && (
        <>
          <p className="player-stats-summary">{summary(data.byMonth)}</p>

          <dl className="player-stats-tiles">
            {tiles.map(([label, value]) => (
              <div key={label} className="player-stats-tile">
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>

          <section aria-labelledby="ps-sports">
            <h2 id="ps-sports">Games per sport</h2>
            <table className="player-stats-table" aria-labelledby="ps-sports">
              <thead>
                <tr>
                  <th scope="col">Sport</th>
                  <th scope="col" className="player-stats-num">
                    Games
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.bySport.map((s) => (
                  <tr key={s.sport}>
                    <td>{cap(s.sport)}</td>
                    <td className="player-stats-num">{s.games}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section aria-labelledby="ps-chart">
            <h2 id="ps-chart">Hours and win rate by month</h2>
            <div className="player-stats-canvas">
              <canvas
                ref={canvasRef}
                role="img"
                aria-label={`Bar chart of hours played per month, with a line for win rate. ${summary(data.byMonth)}`}
              />
            </div>
          </section>
        </>
      )}
    </div>
  );
}

PlayerStats.propTypes = {};

export default PlayerStats;
