import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from "react";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import VerifyToken from "./pages/VerifyToken";

function App() {
  const [isAuth, setIsAuth] = useState(localStorage.getItem("auth") === "true");
  return <BrowserRouter><Routes>
    <Route path="/" element={isAuth ? <Dashboard onLogout={() => { localStorage.removeItem("auth"); setIsAuth(false); }} /> : <Login setIsAuth={setIsAuth} />} />
    <Route path="/verify/:id" element={<VerifyToken />} />
  </Routes></BrowserRouter>;
}
export default App;
