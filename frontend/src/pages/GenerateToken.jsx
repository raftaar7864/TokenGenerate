import { useState } from "react";
import axios from "axios";
import html2pdf from "html2pdf.js";

const API = "http://localhost:5000/api/tokens";
const categories = ["Food", "Car", "Toto", "Bike", "Durgapuja 2026", "বস্ত্র বিতরণ", "Others"];
const dateText = value => value ? new Date(value).toLocaleDateString("en-GB") : "N/A";

export default function GenerateToken() {
  const [tab,setTab]=useState("generate");
  const [category,setCategory]=useState("Food");
  const [count,setCount]=useState(1);
  const [validUpto,setValidUpto]=useState("");
  const [tokens,setTokens]=useState([]);
  const [batchNumber,setBatchNumber]=useState("");
  const [searchValue,setSearchValue]=useState("");
  const [loading,setLoading]=useState(false);
  const [notice,setNotice]=useState("");
  const generate=async()=>{
    if(Number(count)<1){setNotice("Enter at least one token.");return;}
    setLoading(true);setNotice("");
    try { const {data}=await axios.post(`${API}/bulk-generate`,{category,count:Number(count),validUpto});
      setTokens(data.tokens||[]);setBatchNumber(data.batchNumber||"");setNotice(`${(data.tokens||[]).length} tokens generated successfully.`);
    } catch(err){setNotice(err.response?.data?.error||"Generation failed. Check that the server is running.");}
    finally{setLoading(false);}
  };
  const regenerate=async(type)=>{
    if(!searchValue.trim()){setNotice("Enter a batch number or token number first.");return;}
    setLoading(true);setNotice("");
    try{
      if(type==="batch"){const {data}=await axios.get(`${API}/batch/${encodeURIComponent(searchValue.trim())}`);setTokens(data.tokens||[]);setBatchNumber(searchValue.trim());}
      else{const {data}=await axios.get(`${API}/${encodeURIComponent(searchValue.trim())}`);setTokens([data]);setBatchNumber(data.batchNumber||"");}
      setNotice("Record loaded. You can now print or export it.");
    }catch{setTokens([]);setBatchNumber("");setNotice("No matching record found. Check the number and try again.");}
    finally{setLoading(false);}
  };
  const exportExcel=()=>{
    if(!tokens.length){setNotice("There are no tokens to export.");return;}
    const rows=[["Batch No","SL","Token Number","Category","Valid Upto","Status"],...tokens.map((t,i)=>[t.batchNumber,i+1,t.tokenNumber,t.category,dateText(t.validUpto),t.paymentStatus||"Unpaid"])];
    const csv=rows.map(row=>row.map(v=>`"${String(v??"").replace(/"/g,'""')}"`).join(",")).join("\r\n");
    const url=URL.createObjectURL(new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8;"}));
    const link=document.createElement("a");link.href=url;link.download=`${batchNumber||"tokens"}.csv`;link.click();URL.revokeObjectURL(url);
  };
  const downloadPDF=()=>{
    if(!tokens.length){setNotice("There are no tokens to export.");return;}
    html2pdf().set({margin:0,filename:`${batchNumber||"tokens"}.pdf`,html2canvas:{scale:2},jsPDF:{unit:"mm",format:"a4",orientation:"portrait"}}).from(document.querySelector(".print-area")).save();
  };
  const pages=Array.from({length:Math.ceil(tokens.length/25)},(_,i)=>tokens.slice(i*25,i*25+25));
  return <>
    <div className="panel">
      <div className="tabs"><button className={`tab ${tab==="generate"?"active":""}`} onClick={()=>{setTab("generate");setNotice("");}}>✦ &nbsp;New batch</button><button className={`tab ${tab==="regenerate"?"active":""}`} onClick={()=>{setTab("regenerate");setNotice("");}}>↻ &nbsp;Find / reprint</button></div>
      {tab==="generate"?<>
        <div className="panel-heading"><div><h2>Create a token batch</h2><p className="muted" style={{margin:"6px 0 0",fontSize:13}}>Choose a category and how many tokens you need.</p></div><span className="pill">NEW BATCH</span></div>
        <div className="form-grid">
          <div><label htmlFor="category">Token category</label><select id="category" value={category} onChange={e=>setCategory(e.target.value)}>{categories.map(c=><option key={c}>{c}</option>)}</select></div>
          <div><label htmlFor="count">Number of tokens</label><input id="count" type="number" min="1" max="10000" value={count} onChange={e=>setCount(e.target.value)} required/></div>
          <div className="field-full"><label htmlFor="valid">Valid until <span className="muted">(optional)</span></label><input id="valid" type="date" value={validUpto} onChange={e=>setValidUpto(e.target.value)}/></div>
        </div>
        <div className="form-actions"><button className="btn btn-primary" onClick={generate} disabled={loading}>{loading?"Creating batch…":"Generate tokens  →"}</button><button className="btn btn-outline" onClick={()=>{setCount(1);setValidUpto("");setNotice("");}}>Reset form</button></div>
      </>:<>
        <div className="panel-heading"><div><h2>Find existing tokens</h2><p className="muted" style={{margin:"6px 0 0",fontSize:13}}>Load a complete batch or a single token for reprinting.</p></div><span className="pill">LOOKUP</span></div>
        <label htmlFor="lookup">Batch number or token number</label><div className="search-row"><input id="lookup" value={searchValue} onChange={e=>setSearchValue(e.target.value)} onKeyDown={e=>e.key==="Enter"&&regenerate("batch")} placeholder="e.g. BATCH-001 or token ID"/><button className="btn btn-primary" disabled={loading} onClick={()=>regenerate("batch")}>Find batch</button><button className="btn btn-outline" disabled={loading} onClick={()=>regenerate("token")}>Find token</button></div>
      </>}
      {notice&&<div className="notice" role="status" style={{marginTop:18}}>{notice}</div>}
    </div>
    {batchNumber&&<><div className="stats-grid" style={{gridTemplateColumns:"repeat(2,minmax(0,1fr))"}}><div className="stat-card"><div className="stat-top">BATCH REFERENCE <span className="stat-icon">▦</span></div><div className="stat-value" style={{fontSize:22}}>{batchNumber}</div><div className="stat-foot">Batch number</div></div><div className="stat-card"><div className="stat-top">TOKENS LOADED <span className="stat-icon">▤</span></div><div className="stat-value">{tokens.length}</div><div className="stat-foot">Ready to print or export</div></div></div>
      <div className="panel"><div className="panel-heading"><div><h2>Batch preview</h2><p className="muted" style={{fontSize:13,margin:"6px 0 0"}}>Review the loaded tokens before printing.</p></div><div className="inline-actions"><button className="btn btn-outline" onClick={()=>window.print()}>↗ Print</button><button className="btn btn-light" onClick={downloadPDF}>↓ PDF</button><button className="btn btn-light" onClick={exportExcel}>↓ CSV</button></div></div>
      <div className="table-wrap"><table><thead><tr><th>#</th><th>Token number</th><th>Category</th><th>Valid until</th><th>Payment</th></tr></thead><tbody>{tokens.map((t,i)=><tr key={t._id||t.tokenNumber||i}><td>{i+1}</td><td><strong>{t.tokenNumber}</strong></td><td>{t.category}</td><td>{dateText(t.validUpto)}</td><td><span className={`pill ${t.paymentStatus==="Paid"?"paid":"unpaid"}`}>{t.paymentStatus||"Unpaid"}</span></td></tr>)}</tbody></table></div>
      </div>
    </>}
    <div className="print-area print-only">{pages.map((page,pi)=><div className="page" key={pi}>{page.map((t,i)=><div className="slip" key={t._id||t.tokenNumber||i}><div className="token-number">Slip No: {pi*25+i+1}</div><div className="category">{t.category}</div><img src={t.qrCode} className="qr" alt="Token QR code"/><div className="valid-date">Valid Upto: {dateText(t.validUpto)}<br/>আয়োজক অসীম কুমার বিশ্বাস<br/>বিধায়ক রানাঘাট দক্ষিণ বিধানসভা</div></div>)}</div>)}</div>
  </>;
}
