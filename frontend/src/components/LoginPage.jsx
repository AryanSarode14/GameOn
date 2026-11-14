import "./LoginPage.css";
import { useEffect, useRef, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useUser } from "../context/UserContext.jsx";

function LoginPage() {
  const { user, setUser, loading } = useUser();
  const location = useLocation();
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({ login: [], register: [] });
  const loginAlert = useRef(null);
  const registerAlert = useRef(null);

  useEffect(() => {
    if (errors.login.length) loginAlert.current.focus();
  }, [errors.login]);

  useEffect(() => {
    if (errors.register.length) registerAlert.current.focus();
  }, [errors.register]);

  if (loading) return <p role="status">Loading…</p>;
  if (user)
    return <Navigate to={location.state?.from?.pathname ?? "/games"} replace />;

  async function submit(e, form) {
    e.preventDefault();
    const body = JSON.stringify(
      Object.fromEntries(new FormData(e.currentTarget)),
    );
    setBusy(true);
    setErrors((prev) => ({ ...prev, [form]: [] }));
    try {
      const res = await fetch(`/api/auth/${form}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) return setUser(data);
      const msgs = data.errors ?? [
        data.error ?? "Something went wrong. Try again.",
      ];
      setErrors((prev) => ({ ...prev, [form]: msgs }));
    } catch {
      setErrors((prev) => ({
        ...prev,
        [form]: ["Couldn't reach the server. Try again."],
      }));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-page">
      <h1>Log in or create an account</h1>
      <div className="login-forms">
        <section className="login-card" aria-labelledby="login-heading">
          <h2 id="login-heading">Log in</h2>
          <form onSubmit={(e) => submit(e, "login")}>
            <label htmlFor="login-username">Username</label>
            <input
              id="login-username"
              name="username"
              autoComplete="username"
              required
            />
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
            <button type="submit" disabled={busy}>
              Log in
            </button>
            {errors.login.length > 0 && (
              <div
                className="alert"
                role="alert"
                tabIndex={-1}
                ref={loginAlert}
              >
                <ul>
                  {errors.login.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              </div>
            )}
          </form>
        </section>

        <section className="login-card" aria-labelledby="register-heading">
          <h2 id="register-heading">Create account</h2>
          <form onSubmit={(e) => submit(e, "register")}>
            <label htmlFor="register-username">Username</label>
            <input
              id="register-username"
              name="username"
              autoComplete="username"
              required
            />
            <label htmlFor="register-password">Password</label>
            <input
              id="register-password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
            />
            <button type="submit" disabled={busy}>
              Create account
            </button>
            {errors.register.length > 0 && (
              <div
                className="alert"
                role="alert"
                tabIndex={-1}
                ref={registerAlert}
              >
                <ul>
                  {errors.register.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              </div>
            )}
          </form>
        </section>
      </div>
    </div>
  );
}

LoginPage.propTypes = {};

export default LoginPage;
