import { useState } from "react";
import GenerateToken from "./GenerateToken";
import VerifyToken from "./VerifyToken";
import Report from "./Report";

const nav = [
  { id: "generate", icon: "✦", label: "Generate tokens" },
  { id: "verify", icon: "⌁", label: "Verify & payments" },
  { id: "report", icon: "▥", label: "Reports & insights" }
];
export default function Dashboard({ onLogout }) {
  const [tab, setTab] = useState("generate");
  const active = nav.find(n => n.id === tab);
  return <div className="app-shell">
    <header className="topbar"><div className="brand"><div className="brand-mark">✦</div><div>Dr. Biswas<small>Token Generate Software</small></div></div>
      <div className="top-actions"><div className="avatar">A</div><span className="user-label" style={{fontSize:13,fontWeight:700}}>Administrator</span><button className="btn btn-outline" onClick={onLogout}>Log out ↗</button></div>
    </header>
    <div className="workspace">
      <aside className="sidebar"><div className="side-label">Workspace</div>{nav.map(n=><button key={n.id} className={`nav-item ${tab===n.id?"active":""}`} onClick={()=>setTab(n.id)}><span>{n.icon}</span>{n.label}</button>)}<div className="sidebar-note"><strong>Quick tip</strong><br/>Keep your batch number handy to quickly find and reprint a token batch.</div></aside>
      <main className="main-content">
        <div className="page-heading"><div><div className="eyebrow">YOUR WORKSPACE / {active.label.toUpperCase()}</div><h1>{tab==="generate"?"Token operations":tab==="verify"?"Verify a token":"Reports & insights"}</h1><p>{tab==="generate"?"Create new token batches or find existing ones to reprint.":tab==="verify"?"Scan or search tokens and update payment status.":"See collection totals and category-wise activity."}</p></div><div className="avatar" aria-hidden="true">✦</div></div>
        {tab==="generate"&&<GenerateToken/>}{tab==="verify"&&<VerifyToken/>}{tab==="report"&&<Report/>}
      </main>
    </div>
  </div>;
}
