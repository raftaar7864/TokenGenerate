
import { useState } from "react";
import axios from "axios";

import GenerateToken from "./GenerateToken";
import VerifyToken from "./VerifyToken";
import Report from "./Report";

const adminNav = [
  { id: "generate", icon: "✦", label: "Generate tokens" },
  { id: "verify", icon: "⌁", label: "Verify & payments" },
  { id: "report", icon: "▥", label: "Reports & insights" },
];

const verifierNav = [
  { id: "verify", icon: "⌁", label: "Verify tokens" },
];

const API =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV
    ? "http://localhost:5000"
    : "https://tokenback.drbiswas.co.in");

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
}

function clearAuthentication() {
  localStorage.removeItem("auth");
  localStorage.removeItem("authToken");
  localStorage.removeItem("user");

  delete axios.defaults.headers.common.Authorization;
}

export default function Dashboard({ onLogout }) {
  const [user] = useState(getStoredUser);

  const role = String(user.role || "Administrator")
    .trim()
    .toLowerCase();

  const isVerifier = role === "verifier";

  const nav = isVerifier ? verifierNav : adminNav;

  const [tab, setTab] = useState(isVerifier ? "verify" : "generate");
  const [loggingOut, setLoggingOut] = useState(false);

  const active = nav.find((item) => item.id === tab) || nav[0];

  const displayRole = isVerifier ? "Verifier" : "Administrator";

  const displayName =
    user.name ||
    user.fullName ||
    user.username ||
    displayRole;

  const pageDetails = {
    generate: {
      title: "Token operations",
      description:
        "Create new token batches or find existing batches to reprint.",
    },
    verify: {
      title: isVerifier ? "Token verification" : "Verify a token",
      description:
        "Scan or search tokens and check their payment status.",
    },
    report: {
      title: "Reports & insights",
      description:
        "Review collection totals and category-wise activity.",
    },
  };

  const page = pageDetails[active.id] || pageDetails.verify;

  const handleTabChange = (id) => {
    if (isVerifier && id !== "verify") return;

    setTab(id);
  };

  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);

    // Remove local credentials immediately.
    clearAuthentication();

    try {
      // Notify the parent component so React switches to the login page.
      if (typeof onLogout === "function") {
        await onLogout();
      }
    } catch (error) {
      console.error("Logout handler error:", error);
    } finally {
      // Ensure the login screen is displayed even if the parent handler
      // fails to update the authentication state.
      clearAuthentication();
      window.location.replace(window.location.pathname);
    }
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">✦</div>

          <div>
            Dr. Biswas
            <small>Token Generate Software</small>
          </div>
        </div>

        <div className="top-actions">
          <div className="avatar" aria-hidden="true">
            {String(displayName).charAt(0).toUpperCase()}
          </div>

          <div className="user-label">
            <div style={{ fontSize: 13, fontWeight: 700 }}>
              {displayName}
            </div>

            <div
              style={{
                fontSize: 11,
                color: "#718096",
                marginTop: 2,
              }}
            >
              {displayRole}
            </div>
          </div>

          <button
            className="btn btn-outline"
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? "Logging out…" : "Log out ↗"}
          </button>
        </div>
      </header>

      <div className="workspace">
        <aside className="sidebar">
          <div className="side-label">Workspace</div>

          {nav.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`nav-item ${
                active.id === item.id ? "active" : ""
              }`}
              onClick={() => handleTabChange(item.id)}
              aria-current={
                active.id === item.id ? "page" : undefined
              }
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}

          <div className="sidebar-note">
            <strong>
              {isVerifier ? "Verification desk" : "Quick tip"}
            </strong>

            <br />

            {isVerifier
              ? "Scan or search a token to check its details and payment status."
              : "Keep your batch number handy to quickly find and reprint a token batch."}
          </div>
        </aside>

        <main className="main-content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                YOUR WORKSPACE / {active.label.toUpperCase()}
              </div>

              <h1>{page.title}</h1>
              <p>{page.description}</p>
            </div>

            <div className="avatar" aria-hidden="true">
              ✦
            </div>
          </div>

          {active.id === "generate" && !isVerifier && (
            <GenerateToken />
          )}

          {active.id === "verify" && <VerifyToken />}

          {active.id === "report" && !isVerifier && <Report />}
        </main>
      </div>
    </div>
  );
}