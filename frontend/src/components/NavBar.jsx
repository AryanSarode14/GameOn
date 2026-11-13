import "./NavBar.css";
import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext.jsx";

function NavBar() {
  const { user, setUser, loading } = useUser();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleLogout() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (!res.ok) throw new Error();
      setUser(null);
      navigate("/");
    } catch {
      setError("Log out failed. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <header className="navbar">
      <nav className="navbar-main" aria-label="Main">
        <Link to="/" className="navbar-brand">
          GameOn
        </Link>
        <ul className="navbar-links">
          <li><NavLink to="/games" end>Game Board</NavLink></li>
          <li><NavLink to="/games/insights">Popular Times</NavLink></li>
          <li><NavLink to="/log" end>Player Log</NavLink></li>
          <li><NavLink to="/log/stats">My Stats</NavLink></li>
        </ul>
      </nav>
      {!loading && (
        <div className="navbar-user">
          {user ? (
            <>
              <span>{user.username}</span>
              <button type="button" onClick={handleLogout} disabled={busy}>
                Log out
              </button>
              {error && <p className="alert" role="alert">{error}</p>}
            </>
          ) : (
            <NavLink to="/login">Log in</NavLink>
          )}
        </div>
      )}
    </header>
  );
}

NavBar.propTypes = {};

export default NavBar;
