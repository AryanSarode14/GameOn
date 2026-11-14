import "./App.css";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import { UserProvider } from "./context/UserContext.jsx";
import NavBar from "./components/NavBar.jsx";
import RequireLogin from "./components/RequireLogin.jsx";
import Home from "./components/Home.jsx";
import LoginPage from "./components/LoginPage.jsx";
import GameBoard from "./components/GameBoard.jsx";
import GameForm from "./components/GameForm.jsx";
import GameInsights from "./components/GameInsights.jsx";
import PlayerLog from "./components/PlayerLog.jsx";
import LogForm from "./components/LogForm.jsx";
import PlayerStats from "./components/PlayerStats.jsx";

function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <NavBar />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/games" element={<GameBoard />} />
            <Route
              path="/games/new"
              element={
                <RequireLogin>
                  <GameForm />
                </RequireLogin>
              }
            />
            <Route
              path="/games/:id/edit"
              element={
                <RequireLogin>
                  <GameForm />
                </RequireLogin>
              }
            />
            <Route path="/games/insights" element={<GameInsights />} />
            <Route
              path="/log"
              element={
                <RequireLogin>
                  <PlayerLog />
                </RequireLogin>
              }
            />
            <Route
              path="/log/new"
              element={
                <RequireLogin>
                  <LogForm />
                </RequireLogin>
              }
            />
            <Route
              path="/log/:id/edit"
              element={
                <RequireLogin>
                  <LogForm />
                </RequireLogin>
              }
            />
            <Route
              path="/log/stats"
              element={
                <RequireLogin>
                  <PlayerStats />
                </RequireLogin>
              }
            />
            <Route
              path="*"
              element={
                <p>
                  Page not found. <Link to="/">Go to Home</Link>
                </p>
              }
            />
          </Routes>
        </main>
      </BrowserRouter>
    </UserProvider>
  );
}

App.propTypes = {};

export default App;
