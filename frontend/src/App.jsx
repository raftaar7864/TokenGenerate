import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import VerifyToken from "./pages/VerifyToken";
function App() {
  const [isAuth, setIsAuth] = useState(localStorage.getItem("auth") === "true" && !!localStorage.getItem("authToken"));
  useEffect(() => { const token = localStorage.getItem("authToken"); if (token) axios.defaults.headers.common.Authorization = `Bearer ${token}`; }, []);
  return <BrowserRouter><Routes><Route path="/" element={isAuth ? <Dashboard /> : <Login setIsAuth={setIsAuth} />} /><Route path="/verify/:id" element={isAuth ? <VerifyToken /> : <Navigate to="/" replace />} /><Route path="*" element={<Navigate to="/" replace />} /></Routes></BrowserRouter>;
}
export default App;
