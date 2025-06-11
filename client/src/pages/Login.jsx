import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Layout from "../components/Layout";
import AnimatedPage from "../components/AnimatedPage";
import Title from "../components/Title";
import Toast from "../components/Toast";
import QuickDoctorAccess from "../components/QuickDoctorAccess";
import { useToast } from "../hooks/useToast";
import { getWelcomeMessage, debugUserData } from "../utils/userUtils";
import BACKEND_URL from "../config/api";

export default function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickLogin, setShowQuickLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { toasts, showSuccess, showError, removeToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/auth/login`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Identifiants incorrects");
      }

      // Debug pour diagnostiquer le problème
      console.log('🔍 Données reçues du serveur:', data.user);
      debugUserData(data.user);

      // Stocker les informations utilisateur
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("token", data.token);
      localStorage.setItem("isAuthenticated", "true");

      // Déclencher un événement pour notifier App.jsx du changement
      window.dispatchEvent(new Event('authStateChanged'));

      // Utiliser l'utilitaire pour l'affichage
      const welcomeMessage = getWelcomeMessage(data.user, 'Connexion réussie ! Bienvenue');
      showSuccess(welcomeMessage, 3000);

      // Redirection selon le rôle
      setTimeout(() => {
        const role = data.user.role?.name || 'visiteur';
        switch (role) {
          case "medecin":
            navigate("/dashboard/medecin");
            break;
          case "secretaire":
            navigate("/dashboard/secretaire");
            break;
          case "patient":
            navigate("/dashboard/patient");
            break;
          case "visiteur":
            navigate("/dashboard/visiteur");
            break;
          default:
            navigate("/");
        }
      }, 1500);

    } catch (error) {
      console.error("Erreur de connexion:", error);
      showError(error.message || "Identifiants incorrects", 5000);
      // Nettoyer le stockage local en cas d'erreur
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("isAuthenticated");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value.trim()
    }));
  };

  const handleQuickLogin = async (credentials) => {
    setFormData(credentials);
    try {
      await handleSubmit({ preventDefault: () => {} });
    } catch (error) {
      console.error("Erreur connexion rapide:", error);
    }
  };

  return (
    <Layout>
      <AnimatedPage>
        <div className="max-w-md mx-auto bg-white p-6 sm:p-8 rounded-xl accessible-shadow">
          <Title level={1}>🔐 Connexion</Title>

          {/* Message d'aide principal */}
          <div className="help-text mb-6">
            <p className="text-center font-medium">
              Entrez votre email et mot de passe pour vous connecter
            </p>
          </div>

          {/* Connexions rapides des docteurs */}
                            <QuickDoctorAccess 
                    mode="login"
                    onQuickLogin={handleQuickLogin} 
                    isExternalLoading={isLoading}
                    title="Connexions rapides médecins"
                  />

          {/* Boutons de test simplifié */}
          <div className="mb-8">
            <button
              onClick={() => setShowQuickLogin(!showQuickLogin)}
              className="w-full high-contrast-button touch-target-large bg-amber-100 hover:bg-amber-200 text-amber-800 border-amber-300 gentle-transition"
              type="button"
              aria-expanded={showQuickLogin}
              aria-controls="quick-login-section"
            >
              🧪 {showQuickLogin ? 'Masquer' : 'Voir'} les comptes de démonstration
            </button>

            {showQuickLogin && (
              <div 
                id="quick-login-section"
                className="mt-4 bg-gray-50 border-2 border-gray-200 rounded-xl p-4"
                role="region"
                aria-label="Comptes de démonstration"
              >
                <h3 className="font-bold text-gray-900 mb-4 text-center senior-friendly-text">
                  Comptes de test disponibles
                </h3>
                <div className="space-y-3">
                  <button
                    onClick={() => handleQuickLogin({
                      email: "medecin@lineup.com",
                      password: "medecin123"
                    })}
                    className="w-full high-contrast-button touch-target-large bg-green-100 hover:bg-green-200 text-green-800 border-green-300 gentle-transition"
                    disabled={isLoading}
                    aria-label="Se connecter en tant que médecin de démonstration"
                  >
                    👨‍⚕️ Médecin (Démonstration)
                  </button>
                  <button
                    onClick={() => handleQuickLogin({
                      email: "secretaire@lineup.com",
                      password: "secretaire123"
                    })}
                    className="w-full high-contrast-button touch-target-large bg-purple-100 hover:bg-purple-200 text-purple-800 border-purple-300 gentle-transition"
                    disabled={isLoading}
                    aria-label="Se connecter en tant que secrétaire de démonstration"
                  >
                    👩‍💼 Secrétaire (Démonstration)
                  </button>
                  <button
                    onClick={() => handleQuickLogin({
                      email: "patient@lineup.com",
                      password: "patient123"
                    })}
                    className="w-full high-contrast-button touch-target-large bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300 gentle-transition"
                    disabled={isLoading}
                    aria-label="Se connecter en tant que patient de démonstration"
                  >
                    🏥 Patient (Démonstration)
                  </button>
                  <button
                    onClick={() => handleQuickLogin({
                      email: "visiteur@lineup.com",
                      password: "visiteur123"
                    })}
                    className="w-full high-contrast-button touch-target-large bg-yellow-100 hover:bg-yellow-200 text-yellow-800 border-yellow-300 gentle-transition"
                    disabled={isLoading}
                    aria-label="Se connecter en tant que visiteur de démonstration"
                  >
                    👁️ Visiteur (Démonstration)
                  </button>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div>
              <label 
                htmlFor="email"
                className="block senior-friendly-text font-semibold text-gray-800 mb-3 text-left"
              >
                📧 Adresse email
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full touch-target-large px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-blue-200 focus:border-blue-500 gentle-transition senior-friendly-text"
                placeholder="Exemple: jean@email.com"
                disabled={isLoading}
                aria-describedby="email-help"
                autoComplete="email"
              />
              <div id="email-help" className="mt-2 text-sm text-gray-600 text-left">
                Entrez votre adresse email complète
              </div>
            </div>

            <div>
              <label 
                htmlFor="password"
                className="block senior-friendly-text font-semibold text-gray-800 mb-3 text-left"
              >
                🔒 Mot de passe
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full touch-target-large px-4 py-3 pr-12 border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-blue-200 focus:border-blue-500 gentle-transition senior-friendly-text bg-white text-gray-700"
                  placeholder="Votre mot de passe"
                  disabled={isLoading}
                  aria-describedby="password-help"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors touch-target-large"
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  disabled={isLoading}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
              <div id="password-help" className="mt-2 text-sm text-gray-600 text-left">
                Entrez votre mot de passe
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !formData.email || !formData.password}
              className={`w-full touch-target-large high-contrast-button gentle-transition ${
                isLoading || !formData.email || !formData.password
                  ? "bg-gray-400 cursor-not-allowed border-gray-400 text-gray-600"
                  : "bg-blue-600 hover:bg-blue-700 border-blue-600 text-white"
              }`}
              aria-describedby="submit-help"
            >
              {isLoading ? (
                <>
                  <span className="animate-spin inline-block mr-3">⏳</span>
                  Connexion en cours...
                </>
              ) : (
                "Se connecter"
              )}
            </button>
            
            {(!formData.email || !formData.password) && (
              <div id="submit-help" className="text-sm text-gray-600 text-center">
                Veuillez remplir tous les champs pour continuer
              </div>
            )}
          </form>

          {/* Lien vers inscription */}
          <div className="mt-8 pt-6 border-t-2 border-gray-200">
            <p className="senior-friendly-text text-gray-700 mb-4 text-center">
              Vous n'avez pas encore de compte ?
            </p>
            <Link
              to="/register"
              className="block w-full text-center high-contrast-button touch-target-large bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300 gentle-transition no-underline"
              aria-label="Créer un nouveau compte"
            >
              ✨ Créer un compte
            </Link>
          </div>
        </div>

        {/* Toasts pour les messages */}
        <Toast toasts={toasts} removeToast={removeToast} />
      </AnimatedPage>
    </Layout>
  );
} 