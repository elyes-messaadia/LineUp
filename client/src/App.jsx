import { Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import Ticket from "./pages/Ticket";
import Queue from "./pages/Queue";
import AdminLogin from "./pages/AdminLogin";
import Admin from "./pages/Admin";
import RegisterAdmin from "./pages/RegisterAdmin";
import RegisterPatient from "./pages/RegisterPatient";
import LoginPatient from "./pages/LoginPatient";

function App() {
  return (
    <div>
      <nav className="p-4 bg-blue-600 text-white flex justify-between">
        <Link to="/">Accueil</Link>
        <Link to="/ticket">Ticket</Link>
        <Link to="/queue">File</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/ticket" element={<Ticket />} />
        <Route path="/queue" element={<Queue />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/register-admin" element={<RegisterAdmin />} />
        <Route path="/register-patient" element={<RegisterPatient />} />
        <Route path="/login-patient" element={<LoginPatient />} />
      </Routes>
    </div>
  );
}

export default App;
