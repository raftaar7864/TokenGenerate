import { useState } from "react";
import axios from "axios";

export default function Login({ setIsAuth }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const login = async (e) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      await axios.post("http://localhost:5000/api/auth/login", { username, password });
      localStorage.setItem("auth", "true"); setIsAuth(true);
    } catch { setError("Those details didn't match. Please try again."); }
    finally { setLoading(false); }
  };
  return <main className="login-page">
    <section className="login-visual">
      <div className="brand"><div className="brand-mark">✦</div><div>Dr. Biswas<small>Token Generate Software</small></div></div>
      <div><div className="login-badge">✦ &nbsp; Simple. Secure. Organised.</div><h1>Every token.<br/>Under control.</h1><p>Generate batches, verify payments, and keep every record moving with one clear workspace.</p><div className="login-mini-stats"><div><strong>01</strong><span>Generate</span></div><div><strong>02</strong><span>Verify</span></div><div><strong>03</strong><span>Report</span></div></div></div>
      <div style={{fontSize:11,color:"#d8d3ff"}}>TOKENFLOW WORKSPACE · BUILT FOR EVERY SCREEN</div>
    </section>
    <section className="login-form-side"><form className="login-card" onSubmit={login}>
      <div className="eyebrow">WELCOME BACK</div><h2>Sign in to continue</h2><p>Enter your account details to open your token workspace.</p>
      <label htmlFor="username">Username</label><input id="username" autoComplete="username" value={username} onChange={e=>setUsername(e.target.value)} placeholder="Enter your username" required/>
      <label htmlFor="password">Password</label><input id="password" type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter your password" required/>
      {error && <div className="error-text" role="alert">{error}</div>}
      <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? "Signing in…" : "Sign in  →"}</button>
      <div className="login-foot">Your operations, in one place. &nbsp;·&nbsp; TokenFlow</div>
    </form></section>
  </main>;
}
