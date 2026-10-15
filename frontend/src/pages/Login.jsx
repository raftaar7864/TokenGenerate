
import { useState } from "react";
import axios from "axios";

const API_BASE = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

export default function Login({ setIsAuth }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const login = async (e) => {
    e.preventDefault();

    if (loading) return;

    setError("");
    setLoading(true);

    try {
      await axios.post(`${API_BASE}/api/auth/login`, {
        username: username.trim(),
        password,
      });

      localStorage.setItem("auth", "true");
      setIsAuth(true);
    } catch (err) {
      console.error("Login failed:", err);

      if (err.response?.status === 401 || err.response?.status === 400) {
        setError("Username or password is incorrect. Please try again.");
      } else if (!err.response) {
        setError(
          "Unable to connect to the server. Check your internet connection and try again."
        );
      } else {
        setError(
          err.response.data?.error ||
            "Login failed. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-visual">
        <div className="brand">
          <div className="brand-mark">✦</div>
          <div>
            Dr. Biswas
            <small>Token Generate Software</small>
          </div>
        </div>

        <div className="login-hero-content">
          <div className="login-badge">
            ✦ &nbsp; Simple. Secure. Organised.
          </div>

          <h1>
            Every token.
            <br />
            Under control.
          </h1>

          <p>
            Generate batches, verify payments, and keep every record moving
            with one clear workspace.
          </p>

          <div className="login-mini-stats">
            <div>
              <strong>01</strong>
              <span>Generate</span>
            </div>
            <div>
              <strong>02</strong>
              <span>Verify</span>
            </div>
            <div>
              <strong>03</strong>
              <span>Report</span>
            </div>
          </div>
        </div>

        <div className="login-visual-footer">
          TOKENFLOW WORKSPACE · BUILT FOR EVERY SCREEN
        </div>
      </section>

      <section className="login-form-side">
        <form className="login-card" onSubmit={login}>
          <div className="eyebrow">WELCOME BACK</div>

          <h2>Sign in to continue</h2>

          <p>
            Enter your account details to open your token workspace.
          </p>

          <label htmlFor="username">Username</label>
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            autoCapitalize="none"
            spellCheck={false}
            required
            disabled={loading}
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            disabled={loading}
          />

          {error && (
            <div className="error-text" role="alert">
              {error}
            </div>
          )}

          <button
            className="btn btn-primary"
            type="submit"
            disabled={loading}
          >
            {loading ? "Signing in…" : "Sign in →"}
          </button>

          <div className="login-foot">
            Your operations, in one place. · TokenFlow
          </div>
        </form>
      </section>
    </main>
  );
}
