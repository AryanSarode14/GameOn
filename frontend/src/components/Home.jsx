import "./Home.css";
import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="home">
      <h1>GameOn</h1>
      <p className="home-lead">Find pickup games in Boston and track whether you&apos;re improving.</p>

      <h2>How to use it</h2>
      <div className="home-pages">
        <section className="home-card">
          <h3><Link to="/games">Game Board</Link></h3>
          <p>Find pickup games to join, or post your own so others can find it. Posting needs an account.</p>
        </section>
        <section className="home-card">
          <h3><Link to="/games/insights">Popular Times</Link></h3>
          <p>See where and when people play most, so you know the best places and times to find a game.</p>
        </section>
        <section className="home-card">
          <h3><Link to="/log">Player Log</Link></h3>
          <p>Record the games you play. Your log is private to you; log in to add, edit or delete entries.</p>
        </section>
        <section className="home-card">
          <h3><Link to="/log/stats">My Stats</Link></h3>
          <p>See your games per sport, win rate and a month-by-month trend. Log in to see your stats.</p>
        </section>
      </div>

      <h2>Try the demo</h2>
      <p>
        <Link to="/login">Log in</Link> with username <strong>demo1</strong> and password{" "}
        <strong>(password to be added)</strong>.
      </p>
    </div>
  );
}

Home.propTypes = {};

export default Home;
