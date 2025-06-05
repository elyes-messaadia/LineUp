import { useState, useEffect } from "react";
import { Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import Ticket from "./pages/Ticket";
import Queue from "./pages/Queue";
import Login from "./pages/Login";
import Register from "./pages/Register";
import UserDebugPanel from "./components/UserDebugPanel";
import { getDisplayName } from "./utils/userUtils";

// Dashboards par rôle
import PatientDashboard from "./pages/dashboards/PatientDashboard";
import VisiteurDashboard from "./pages/dashboards/VisiteurDashboard";
import MedecinDashboard from "./pages/dashboards/MedecinDashboard";
import SecretaireDashboard from "./pages/dashboards/SecretaireDashboard";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(localStorage.getItem("isAuthenticated"));
  const [user, setUser] = useState(() => {
    const userData = localStorage.getItem("user");
    return userData ? JSON.parse(userData) : null;
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Écouter les changements d'authentification
  useEffect(() => {
    const handleAuthChange = () => {
      setIsAuthenticated(localStorage.getItem("isAuthenticated"));
      const userData = localStorage.getItem("user");
      setUser(userData ? JSON.parse(userData) : null);
    };

    // Écouter les changements de localStorage (autres onglets)
    window.addEventListener('storage', handleAuthChange);
    
    // Écouter notre événement personnalisé (même onglet)
    window.addEventListener('authStateChanged', handleAuthChange);
    
    return () => {
      window.removeEventListener('storage', handleAuthChange);
      window.removeEventListener('authStateChanged', handleAuthChange);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('isAuthenticated');
    
    // Mettre à jour l'état immédiatement
    setIsAuthenticated(null);
    setUser(null);
    
    // Déclencher l'événement pour notifier d'autres composants
    window.dispatchEvent(new Event('authStateChanged'));
    
    // Rediriger vers l'accueil
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Navigation moderne et responsive */}
      <nav className="bg-white/95 backdrop-blur-md shadow-lg border-b border-blue-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo et navigation principale */}
            <div className="flex items-center space-x-8">
              <Link to="/" className="flex items-center space-x-2 group">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-white font-bold text-lg">L</span>
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  LineUp
                </span>
              </Link>
              
              {/* Navigation desktop */}
              <div className="hidden md:flex space-x-6">
                <Link 
                  to="/" 
                  className="flex items-center space-x-1 px-3 py-2 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
                >
                  <span>🏠</span>
                  <span className="font-medium">Accueil</span>
                </Link>
                <Link 
                  to="/queue" 
                  className="flex items-center space-x-1 px-3 py-2 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
                >
                  <span>📋</span>
                  <span className="font-medium">File d'attente</span>
                </Link>
                {!isAuthenticated && (
                  <Link 
                    to="/ticket" 
                    className="flex items-center space-x-1 px-3 py-2 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
                  >
                    <span>🎫</span>
                    <span className="font-medium">Mon ticket</span>
                  </Link>
                )}
              </div>
            </div>

            {/* Profil utilisateur / Authentification */}
            <div className="hidden md:flex items-center space-x-4">
              {isAuthenticated && user ? (
                <div className="flex items-center space-x-4">
                  {/* Badge utilisateur amélioré */}
                  <div className="flex items-center space-x-3 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2 rounded-full border border-blue-200">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white text-sm font-medium">
                      {user.role?.name === "medecin" && "🩺"}
                      {user.role?.name === "secretaire" && "👩‍💼"}
                      {user.role?.name === "patient" && "👤"}
                      {user.role?.name === "visiteur" && "👁️"}
                    </div>
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">{getDisplayName(user)}</div>
                      <div className="text-gray-500 capitalize">{user.role?.name}</div>
                    </div>
                  </div>
                  
                  {/* Bouton Mon espace */}
                  <Link 
                    to={`/dashboard/${user.role?.name}`}
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <span>📊</span>
                    <span className="font-medium">Mon espace</span>
                  </Link>
                  
                  {/* Bouton déconnexion */}
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 px-4 py-2 rounded-lg transition-all duration-200 border border-red-200"
                    title="Se déconnecter"
                  >
                    <span>🚪</span>
                    <span className="font-medium">Déconnexion</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link 
                    to="/login" 
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <span>🔐</span>
                    <span className="font-medium">Connexion</span>
                  </Link>
                  <Link 
                    to="/register" 
                    className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 py-2 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <span>✨</span>
                    <span className="font-medium">Inscription</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Menu mobile hamburger */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                aria-label="Ouvrir le menu"
              >
                <div className="w-6 h-6 flex flex-col justify-center items-center space-y-1">
                  <span className={`block w-5 h-0.5 bg-current transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
                  <span className={`block w-5 h-0.5 bg-current transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : ''}`}></span>
                  <span className={`block w-5 h-0.5 bg-current transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Menu mobile */}
        <div className={`md:hidden transition-all duration-300 ${isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
          <div className="bg-white border-t border-gray-200 px-4 py-4 space-y-3">
            {/* Navigation mobile */}
            <Link 
              to="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            >
              <span>🏠</span>
              <span className="font-medium">Accueil</span>
            </Link>
            <Link 
              to="/queue"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            >
              <span>📋</span>
              <span className="font-medium">File d'attente</span>
            </Link>
            {!isAuthenticated && (
              <Link 
                to="/ticket"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              >
                <span>🎫</span>
                <span className="font-medium">Mon ticket</span>
              </Link>
            )}

            {/* Profil mobile */}
            {isAuthenticated && user ? (
              <div className="pt-3 border-t border-gray-200 space-y-3">
                <div className="flex items-center space-x-3 px-3 py-2 bg-blue-50 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white">
                    {user.role?.name === "medecin" && "🩺"}
                    {user.role?.name === "secretaire" && "👩‍💼"}
                    {user.role?.name === "patient" && "👤"}
                    {user.role?.name === "visiteur" && "👁️"}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{getDisplayName(user)}</div>
                    <div className="text-sm text-gray-500 capitalize">{user.role?.name}</div>
                  </div>
                </div>
                <Link 
                  to={`/dashboard/${user.role?.name}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                >
                  <span>📊</span>
                  <span className="font-medium">Mon espace</span>
                </Link>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg text-red-600 bg-red-50 hover:bg-red-100 transition-colors w-full"
                >
                  <span>🚪</span>
                  <span className="font-medium">Déconnexion</span>
                </button>
              </div>
            ) : (
              <div className="pt-3 border-t border-gray-200 space-y-3">
                <Link 
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-3 rounded-lg transition-colors hover:bg-blue-700"
                >
                  <span>🔐</span>
                  <span className="font-medium">Connexion</span>
                </Link>
                <Link 
                  to="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-3 rounded-lg transition-colors hover:from-green-700 hover:to-emerald-700"
                >
                  <span>✨</span>
                  <span className="font-medium">Inscription</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Contenu principal avec container responsive */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
        </div>
      </main>
      
      {/* Panneau de debug (toujours visible pour diagnostiquer) */}
      <UserDebugPanel />
    </div>
  );
}

export default App;
