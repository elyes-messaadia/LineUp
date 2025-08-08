import { useState, useEffect } from "react";
import { Routes, Route, Link } from "react-router-dom";
import { Home as HomeIcon, ClipboardList, Ticket as TicketIcon, BarChart3, LogOut, Lock, Star } from "lucide-react";

// Détecte si l’écran est de taille desktop (>= 768px) et renvoie un booléen
const useIsDesktop = () => {
  const [isDesktop, setIsDesktop] = useState(false);
  
  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    
    // Check initial size
    checkScreenSize();
    
    // Listen for resize events
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);
  
  return isDesktop;
};
import Home from "./pages/Home";
import Ticket from "./pages/Ticket";
import Queue from "./pages/Queue";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { getDisplayName } from "./utils/userUtils";
import { getDoctorDashboardRoute } from "./utils/doctorMapping";

// Dashboards par rôle
import PatientDashboard from "./pages/dashboards/PatientDashboard";
import VisiteurDashboard from "./pages/dashboards/VisiteurDashboard";
import MedecinDashboard from "./pages/dashboards/MedecinDashboard";
import SecretaireDashboard from "./pages/dashboards/SecretaireDashboard";

// Dashboards spécifiques des médecins
import DrHusniDashboard from "./pages/dashboards/DrHusniDashboard";
import DrHeliosDashboard from "./pages/dashboards/DrHeliosDashboard";
import DrJeanEricDashboard from "./pages/dashboards/DrJeanEricDashboard";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(localStorage.getItem("isAuthenticated"));
  const [user, setUser] = useState(() => {
    const userData = localStorage.getItem("user");
    return userData ? JSON.parse(userData) : null;
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Utiliser notre hook pour détecter desktop
  const isDesktop = useIsDesktop();

  // Écoute les changements d'authentification et synchronise l'état local
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 overflow-x-hidden">
      {/* Navigation moderne et responsive - Protection overflow */}
      <nav className="bg-white/95 backdrop-blur-md shadow-lg border-b border-blue-100 sticky top-0 z-50 w-full overflow-x-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 w-full min-w-0">
            
            {/* Logo - Toujours visible mais compacte sur mobile */}
            <div className="flex items-center space-x-2 sm:space-x-8 flex-shrink-0">
              <Link to="/" className="flex items-center space-x-2 group">
                                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-white font-bold text-sm sm:text-lg">L</span>
                </div>
                                  <span className="text-lg sm:text-xl font-bold text-blue-600">
                  LineUp
                </span>
              </Link>
              
              {/* Navigation desktop - FORCÉ INVISIBLE sur mobile */}
              <div className="hidden lg:flex space-x-6 force-hide-mobile">
                <Link 
                  to="/" 
                  className="flex items-center space-x-1 px-3 py-2 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
                >
                  <HomeIcon className="w-4 h-4" />
                  <span className="font-medium">Accueil</span>
                </Link>
                <Link 
                  to="/queue" 
                  className="flex items-center space-x-1 px-3 py-2 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
                >
                  <ClipboardList className="w-4 h-4" />
                  <span className="font-medium">File d'attente</span>
                </Link>
                {!isAuthenticated && (
                                      <Link 
                      to="/ticket" 
                      className="flex items-center space-x-1 px-3 py-2 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
                    >
                      <TicketIcon className="w-4 h-4" />
                      <span className="font-medium">Mon ticket</span>
                    </Link>
                )}
              </div>
            </div>

            {/* Profil utilisateur / Authentification - HOOK JAVASCRIPT RÉACTIF */}
            {/* Auth section - Visible seulement sur desktop (768px+) */}
            {isDesktop && (
              <div className="hidden lg:flex items-center space-x-4 flex-shrink-0">
              {isAuthenticated && user ? (
                <div className="flex items-center space-x-4">
                  {/* Badge utilisateur amélioré */}
                  <div className="flex items-center space-x-3 bg-gray-50 px-4 py-2 rounded-full border border-gray-200">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
                      {user.role?.name}
                    </div>
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">{getDisplayName(user)}</div>
                      <div className="text-gray-500 capitalize">{user.role?.name}</div>
                    </div>
                  </div>
                  
                  {/* Bouton Mon espace */}
                  <Link 
                    to={user.role?.name === "medecin" ? getDoctorDashboardRoute(user) : `/dashboard/${user.role?.name}`}
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span className="font-medium">Mon espace</span>
                  </Link>
                  
                  {/* Bouton déconnexion */}
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 px-4 py-2 rounded-lg transition-all duration-200 border border-red-200"
                    title="Se déconnecter"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="font-medium">Déconnexion</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link 
                    to="/login" 
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <Lock className="w-4 h-4" />
                    <span className="font-medium">Connexion</span>
                  </Link>
                  <Link 
                    to="/register" 
                    className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 py-2 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <Star className="w-4 h-4" />
                    <span className="font-medium">Inscription</span>
                  </Link>
                </div>
              )}
            </div>
            )}

            {/* Menu mobile hamburger - Visible sur mobile */}
            <div className="lg:hidden flex-shrink-0">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors touch-target-large"
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

        {/* Menu mobile - Responsive jusqu'aux tablettes */}
        <div className={`lg:hidden transition-all duration-300 ${isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
          <div className="bg-white border-t border-gray-200 px-4 py-4 space-y-3 legacy-container">
            {/* Navigation mobile - Grid sur écrans moyens */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-3">
              <Link 
                to="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-center md:justify-start space-x-2 px-3 py-3 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors touch-target-large"
                >
                <HomeIcon className="w-4 h-4" />
                <span className="font-medium">Accueil</span>
              </Link>
              <Link 
                to="/queue"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-center md:justify-start space-x-2 px-3 py-3 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors touch-target-large"
              >
                <ClipboardList className="w-4 h-4" />
                <span className="font-medium">File d'attente</span>
              </Link>
              {!isAuthenticated && (
                <Link 
                  to="/ticket"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center md:justify-start space-x-2 px-3 py-3 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors touch-target-large"
                >
                  <TicketIcon className="w-4 h-4" />
                  <span className="font-medium">Mon ticket</span>
                </Link>
              )}
            </div>

            {/* Section profil/auth mobile - Layout responsive */}
            {isAuthenticated && user ? (
              <div className="pt-4 border-t border-gray-200 space-y-4">
                {/* Badge utilisateur mobile */}
                <div className="flex items-center space-x-3 px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white flex-shrink-0">
                    {user.role?.name}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-gray-900 truncate">{getDisplayName(user)}</div>
                    <div className="text-sm text-gray-500 capitalize">{user.role?.name}</div>
                  </div>
                </div>
                
                {/* Actions utilisateur - Grid sur écrans moyens */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Link 
                    to={user.role?.name === "medecin" ? getDoctorDashboardRoute(user) : `/dashboard/${user.role?.name}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-center space-x-2 px-4 py-3 rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors touch-target-large"
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span className="font-medium">Mon espace</span>
                  </Link>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="flex items-center justify-center space-x-2 px-4 py-3 rounded-lg text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors touch-target-large"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="font-medium">Déconnexion</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="pt-4 border-t border-gray-200">
                {/* Boutons auth - Grid sur écrans moyens */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Link 
                    to="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-3 rounded-lg transition-colors hover:bg-blue-700 touch-target-large"
                  >
                    <Lock className="w-4 h-4" />
                    <span className="font-medium">Connexion</span>
                  </Link>
                  <Link 
                    to="/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-3 rounded-lg transition-colors hover:from-green-700 hover:to-emerald-700 touch-target-large"
                  >
                    <Star className="w-4 h-4" />
                    <span className="font-medium">Inscription</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Contenu principal avec container responsive */}
      <main className="flex-1 overflow-protection">
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
            
            {/* Dashboards spécifiques des médecins */}
            <Route path="/dashboard/dr-husni-said-habibi" element={<DrHusniDashboard />} />
            <Route path="/dashboard/dr-helios-blasco" element={<DrHeliosDashboard />} />
            <Route path="/dashboard/dr-jean-eric-panacciulli" element={<DrJeanEricDashboard />} />
          </Routes>
        </div>
      </main>
      
      {/* Panneau de debug retiré en production */}
    </div>
  );
}

export default App;
