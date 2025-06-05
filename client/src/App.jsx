import { Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import Ticket from "./pages/Ticket";
import Queue from "./pages/Queue";
import Login from "./pages/Login";
import Register from "./pages/Register";
import UserDebugPanel from "./components/UserDebugPanel";

// Dashboards par rôle
import PatientDashboard from "./pages/dashboards/PatientDashboard";
import VisiteurDashboard from "./pages/dashboards/VisiteurDashboard";
import MedecinDashboard from "./pages/dashboards/MedecinDashboard";
import SecretaireDashboard from "./pages/dashboards/SecretaireDashboard";

function App() {
  const isAuthenticated = localStorage.getItem("isAuthenticated");
  const user = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")) : null;

  return (
    <div>
      <nav className="p-4 bg-blue-600 text-white flex justify-between items-center">
        <div className="flex gap-4">
          <Link to="/" className="hover:text-blue-200 transition">🏠 Accueil</Link>
          <Link to="/queue" className="hover:text-blue-200 transition">📋 File</Link>
          {!isAuthenticated && <Link to="/ticket" className="hover:text-blue-200 transition">🎫 Ticket</Link>}
        </div>
        
        <div className="flex gap-4 items-center">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm bg-blue-500 px-2 py-1 rounded">
                {user.role?.name === "medecin" && "🩺"}
                {user.role?.name === "secretaire" && "👩‍💼"}
                {user.role?.name === "patient" && "👤"}
                {user.role?.name === "visiteur" && "👁️"}
                {" "}{user.fullName || 
                       (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : '') ||
                       user.firstName || 
                       user.lastName || 
                       user.email?.split('@')[0] || 
                       'Utilisateur'}
              </span>
              <Link 
                to={`/dashboard/${user.role?.name}`} 
                className="hover:text-blue-200 transition"
              >
                📊 Mon espace
              </Link>
            </div>
          ) : (
            <div className="flex gap-2">
              <Link to="/login" className="bg-blue-500 px-3 py-1 rounded hover:bg-blue-400 transition">
                🔐 Connexion
              </Link>
              <Link to="/register" className="bg-green-600 px-3 py-1 rounded hover:bg-green-500 transition">
                ✨ Inscription
              </Link>
            </div>
          )}
        </div>
      </nav>

      <Routes>
        {/* Pages publiques */}
        <Route path="/" element={<Home />} />
        <Route path="/queue" element={<Queue />} />
        <Route path="/ticket" element={<Ticket />} />
        
        {/* Authentification */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Dashboards par rôle */}
        <Route path="/dashboard/patient" element={<PatientDashboard />} />
        <Route path="/dashboard/visiteur" element={<VisiteurDashboard />} />
        <Route path="/dashboard/medecin" element={<MedecinDashboard />} />
        <Route path="/dashboard/secretaire" element={<SecretaireDashboard />} />
      </Routes>
      
      {/* Panneau de debug (toujours visible pour diagnostiquer) */}
      <UserDebugPanel />
    </div>
  );
}

export default App;
