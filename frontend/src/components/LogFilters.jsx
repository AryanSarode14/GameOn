import "./LogFilters.css";
import PropTypes from "prop-types";
import { SPORTS, RESULTS } from "../logOptions.js";

const cap = (s) => s[0].toUpperCase() + s.slice(1);

function LogFilters({ filters, onChange }) {
  const change = (e) =>
    onChange({ ...filters, [e.target.name]: e.target.value });
  const clear = () => onChange({ sport: "", result: "", from: "", to: "" });

  return (
    <form
      className="log-filters"
      role="search"
      aria-label="Filter entries"
      onSubmit={(e) => e.preventDefault()}
    >
      <div className="log-filters-field">
        <label htmlFor="log-filter-sport">Sport</label>
        <select
          id="log-filter-sport"
          name="sport"
          value={filters.sport}
          onChange={change}
        >
          <option value="">All</option>
          {SPORTS.map((s) => (
            <option key={s} value={s}>
              {cap(s)}
            </option>
          ))}
        </select>
      </div>
      <div className="log-filters-field">
        <label htmlFor="log-filter-result">Result</label>
        <select
          id="log-filter-result"
          name="result"
          value={filters.result}
          onChange={change}
        >
          <option value="">All</option>
          {RESULTS.map((r) => (
            <option key={r} value={r}>
              {cap(r)}
            </option>
          ))}
        </select>
      </div>
      <div className="log-filters-field">
        <label htmlFor="log-filter-from">From</label>
        <input
          id="log-filter-from"
          name="from"
          type="date"
          max={filters.to || undefined}
          value={filters.from}
          onChange={change}
        />
      </div>
      <div className="log-filters-field">
        <label htmlFor="log-filter-to">To</label>
        <input
          id="log-filter-to"
          name="to"
          type="date"
          min={filters.from || undefined}
          value={filters.to}
          onChange={change}
        />
      </div>
      <button type="button" onClick={clear}>
        Clear
      </button>
    </form>
  );
}

LogFilters.propTypes = {
  filters: PropTypes.shape({
    sport: PropTypes.string.isRequired,
    result: PropTypes.string.isRequired,
    from: PropTypes.string.isRequired,
    to: PropTypes.string.isRequired,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
};

export default LogFilters;
