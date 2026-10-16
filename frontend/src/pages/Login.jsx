import { useState } from "react";
import axios from "axios";

const API =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV
    ? "http://localhost:5000"
    : "https://tokenback.drbiswas.co.in");

export default function Login({ setIsAuth }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const login = async (e) => {
    e.preventDefault();
    setError("");

    const trimmedUsername = username.trim();

    if (!trimmedUsername || !password) {
      setError("Please enter your username and password.");
      return;
    }

    setLoading(true);

    try {
      const { data } = await axios.post(`${API}/api/auth/login`, {
        username: trimmedUsername,
        password,
      });

      if (!data?.token || !data?.user) {
        throw new Error("Invalid response received from server.");
      }

      localStorage.setItem("auth", "true");
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      axios.defaults.headers.common.Authorization = `Bearer ${data.token}`;

      setIsAuth(true);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to sign in. Please try again."
      );
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
            Generate batches, verify tokens, and keep every record
            organised in one simple workspace.
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
            Enter your account details to access your authorised
            token workspace.
          </p>

          <label htmlFor="username">Username</label>
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setError("");
            }}
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
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
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