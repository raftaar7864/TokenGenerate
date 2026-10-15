import { useEffect, useState } from "react";
import axios from "axios";
const API="http://localhost:5000/api/tokens";
const dateText=v=>v?new Date(v).toLocaleDateString("en-GB"):"N/A";
export default function Report(){
 const [report,setReport]=useState(null),[loading,setLoading]=useState(true),[error,setError]=useState("");
 const fetchReport=async()=>{setLoading(true);setError("");try{const {data}=await axios.get(`${API}/report`);setReport(data);}catch{setError("Could not load report data. Check the API connection and retry.");}finally{setLoading(false);}};
 useEffect(()=>{fetchReport();},[]);
 const exportExcel=()=>{
  if(!report?.batchReport?.length)return;
  const rows=[["Batch Number","Category","Total Tokens","Created Date"],...report.batchReport.map(x=>[x.batchNumber,x.category,x.total,dateText(x.createdAt)])];
  const csv=rows.map(r=>r.map(v=>`"${String(v??"").replace(/"/g,'""')}"`).join(",")).join("\r\n");
  const url=URL.createObjectURL(new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8;"}));const a=document.createElement("a");a.href=url;a.download="batch-report.csv";a.click();URL.revokeObjectURL(url);
 };
 if(loading)return <div className="panel empty-state">Loading your report…</div>;
 if(error)return <div className="panel"><p className="error-text">{error}</p><button className="btn btn-primary" onClick={fetchReport}>Try again</button></div>;
 const stats=[["Total tokens",report?.total??0,"▤"],["Paid tokens",report?.paid??0,"✓"],["Unpaid tokens",report?.unpaid??0,"◷"],["Paid today",report?.todayPaid??0,"↗"]];
 return <>
  <div className="stats-grid">{stats.map(([label,value,icon])=><div className="stat-card" key={label}><div className="stat-top">{label}<span className="stat-icon">{icon}</span></div><div className="stat-value">{Number(value).toLocaleString()}</div><div className="stat-foot">Current reporting period</div></div>)}</div>
  <div className="panel"><div className="panel-heading"><div><h2>Batch activity</h2><p className="muted" style={{fontSize:13,margin:"6px 0 0"}}>Token batches created in the system.</p></div><div className="inline-actions"><button className="btn btn-outline" onClick={fetchReport}>↻ Refresh</button><button className="btn btn-primary" onClick={exportExcel}>↓ Export CSV</button></div></div>
   <div className="table-wrap"><table><thead><tr><th>Batch number</th><th>Category</th><th>Total tokens</th><th>Created</th></tr></thead><tbody>{report?.batchReport?.length?report.batchReport.map((item,i)=><tr key={item.batchNumber||i}><td><strong>{item.batchNumber||"—"}</strong></td><td>{item.category||"—"}</td><td>{item.total??0}</td><td>{dateText(item.createdAt)}</td></tr>):<tr><td colSpan="4" className="empty-state">No batch activity to show yet.</td></tr>}</tbody></table></div>
  </div>
  <div className="panel"><div className="panel-heading"><div><h2>Category breakdown</h2><p className="muted" style={{fontSize:13,margin:"6px 0 0"}}>Compare paid and total tokens by category.</p></div></div>
   <div className="table-wrap"><table><thead><tr><th>Category</th><th>Total tokens</th><th>Paid</th><th>Unpaid</th><th>Collection rate</th></tr></thead><tbody>{report?.categoryReport?.length?report.categoryReport.map(c=>{const total=Number(c.total)||0,paid=Number(c.paid)||0,rate=total?Math.round(paid/total*100):0;return <tr key={c._id}><td><strong>{c._id||"Uncategorised"}</strong></td><td>{total}</td><td><span className="pill paid">{paid}</span></td><td><span className="pill unpaid">{Math.max(total-paid,0)}</span></td><td><div style={{display:"flex",alignItems:"center",gap:10,minWidth:130}}><div style={{height:6,background:"#eceef5",borderRadius:9,flex:1,overflow:"hidden"}}><div style={{height:"100%",width:`${rate}%`,background:"#5b4bdb",borderRadius:9}}/></div><strong>{rate}%</strong></div></td></tr>}):<tr><td colSpan="5" className="empty-state">No category data available.</td></tr>}</tbody></table></div>
  </div>
 </>;
}
