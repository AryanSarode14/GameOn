import "./GameFilters.css";
import PropTypes from "prop-types";

const cap = (s) => s[0].toUpperCase() + s.slice(1);
const pad = (n) => String(n).padStart(2, "0");
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

function GameFilters({ filters, options, onChange }) {
  const hoods = [...new Set(options.courts.map((c) => c.neighborhood))];
  const selects = [
    ["sport", "Sport", options.sports, cap],
    ["neighborhood", "Neighborhood", hoods, (n) => n],
    ["skill", "Skill level", options.skills, cap],
  ];
  const change = (e) =>
    onChange({ ...filters, [e.target.name]: e.target.value });
  const clear = () =>
    onChange(Object.fromEntries(Object.keys(filters).map((k) => [k, ""])));

  return (
    <form
      className="game-filters"
      role="search"
      aria-label="Filter games"
      onSubmit={(e) => e.preventDefault()}
    >
      {selects.map(([name, label, list, show]) => (
        <div key={name} className="game-filters-field">
          <label htmlFor={`filter-${name}`}>{label}</label>
          <select
            id={`filter-${name}`}
            name={name}
            value={filters[name]}
            onChange={change}
          >
            <option value="">All</option>
            {list.map((v) => (
              <option key={v} value={v}>
                {show(v)}
              </option>
            ))}
          </select>
        </div>
      ))}
      <div className="game-filters-field">
        <label htmlFor="filter-from">From</label>
        <input
          id="filter-from"
          name="from"
          type="date"
          min={today()}
          value={filters.from}
          onChange={change}
        />
      </div>
      <button type="button" onClick={clear}>
        Clear
      </button>
    </form>
  );
}

GameFilters.propTypes = {
  filters: PropTypes.shape({
    sport: PropTypes.string.isRequired,
    neighborhood: PropTypes.string.isRequired,
    skill: PropTypes.string.isRequired,
    from: PropTypes.string.isRequired,
  }).isRequired,
  options: PropTypes.shape({
    sports: PropTypes.arrayOf(PropTypes.string).isRequired,
    skills: PropTypes.arrayOf(PropTypes.string).isRequired,
    courts: PropTypes.arrayOf(
      PropTypes.shape({
        court: PropTypes.string.isRequired,
        neighborhood: PropTypes.string.isRequired,
        sports: PropTypes.arrayOf(PropTypes.string).isRequired,
      }),
    ).isRequired,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
};

export default GameFilters;
