import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DOCTEURS } from '../config/doctors';
import { useToast } from '../hooks/useToast';
import BACKEND_URL from '../config/api';
import { Stethoscope, UserRound, ShieldPlus, ChevronDown } from 'lucide-react';

/**
 * Composant générique pour l'accès rapide des médecins
 * @param {Object} props
 * @param {Function} props.onQuickLogin - Callback pour connexion externe (mode Login)
 * @param {boolean} props.isExternalLoading - État de loading externe
 * @param {string} props.mode - "login" ou "direct" 
 * @param {string} props.title - Titre personnalisé
 */
export default function QuickDoctorAccess({ 
  onQuickLogin = null, 
  isExternalLoading = false,
  mode = "direct",
  title = "Accès rapide médecins"
}) {
  const [isInternalLoading, setIsInternalLoading] = useState(false);
  const [showDoctorAccess, setShowDoctorAccess] = useState(false);
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const isLoading = mode === "login" ? isExternalLoading : isInternalLoading;

  const handleDoctorAction = async (doctor) => {
    if (mode === "login" && onQuickLogin) {
      // Mode Login - utilise le callback externe
      onQuickLogin({
        email: doctor.credentials.email,
        password: doctor.credentials.password
      });
      return;
    }

    // Mode Direct - gère la connexion en interne
    setIsInternalLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/auth/login`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        credentials: 'include',
        body: JSON.stringify({
          email: doctor.credentials.email,
          password: doctor.credentials.password
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Échec de la connexion");
      }

      // Stocker les informations utilisateur
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("token", data.token);
      localStorage.setItem("isAuthenticated", "true");

      // Déclencher un événement pour notifier App.jsx du changement
      window.dispatchEvent(new Event('authStateChanged'));

      showSuccess(`Connexion réussie ! Bienvenue ${doctor.fullName}`, 3000);

      // Redirection vers le dashboard médecin
      setTimeout(() => {
        navigate("/dashboard/medecin");
      }, 1500);

    } catch (error) {
      console.error("Erreur de connexion:", error);
      showError(error.message || "Impossible de se connecter", 5000);
      
      // Nettoyer le stockage local en cas d'erreur
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("isAuthenticated");
    } finally {
      setIsInternalLoading(false);
    }
  };

  const buttonStyle = mode === "login" 
    ? "w-full bg-blue-100 hover:bg-blue-200 text-blue-800 border-blue-300 p-3 rounded-xl transition-all duration-200 border-2"
    : "w-full p-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-[1.02]";

  const containerStyle = mode === "login"
    ? "bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4"
    : "bg-gradient-to-br from-white to-blue-50 border-2 border-blue-200 rounded-xl p-4 shadow-lg animate-in";

  return (
    <div className="mb-6">
      <button
        onClick={() => setShowDoctorAccess(!showDoctorAccess)}
        className={buttonStyle}
        type="button"
        aria-expanded={showDoctorAccess}
        aria-controls="doctor-access-section"
      >
        <div className="flex items-center justify-center space-x-3">
          <Stethoscope className="w-5 h-5" />
          <span>{title}</span>
          <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${showDoctorAccess ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {showDoctorAccess && (
        <div 
          id="doctor-access-section"
          className={`mt-4 ${containerStyle}`}
          role="region"
          aria-label={`${title} - Zone d'accès rapide`}
        >
              <div className="text-center mb-4">
            <h3 className="font-bold text-blue-900 text-lg mb-2">
                  {mode === "login" ? "Connexion rapide médecins" : "Espace médecins"}
            </h3>
            <p className="text-sm text-blue-700">
              {mode === "login" 
                ? "Cliquez sur un médecin pour vous connecter instantanément"
                : "Accédez directement à votre tableau de bord médical"
              }
            </p>
          </div>
          
          <div className="space-y-3">
            {DOCTEURS.map((doctor) => (
              <button
                key={doctor.id}
                onClick={() => handleDoctorAction(doctor)}
                disabled={isLoading || !doctor.disponible}
                className={`
                  w-full p-4 rounded-xl transition-all duration-200 border-2 text-left
                  ${doctor.disponible 
                    ? 'bg-white hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 text-blue-900 border-blue-300 hover:border-blue-400 hover:shadow-md transform hover:scale-[1.02]' 
                    : 'bg-gray-100 text-gray-500 border-gray-300 cursor-not-allowed'
                  }
                  ${isLoading ? 'opacity-50 cursor-wait' : ''}
                `}
                aria-label={`${mode === "login" ? "Se connecter en tant que" : "Accéder au dashboard de"} ${doctor.fullName}`}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center text-2xl flex-shrink-0 border-2 border-blue-200">
                    <UserRound className="w-6 h-6 text-blue-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-blue-900 truncate text-lg">
                      {doctor.fullName}
                    </p>
                    <p className="text-sm text-blue-700 mb-1">
                      {doctor.specialite}
                    </p>
                    <div className="flex items-center space-x-2">
                       <div className={`w-2 h-2 rounded-full ${doctor.disponible ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className={`text-xs font-medium ${doctor.disponible ? 'text-green-600' : 'text-red-600'}`}>
                        {doctor.disponible ? 'Disponible' : 'Non disponible'}
                      </span>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {isLoading ? (
                      <div className="animate-spin w-5 h-5 sm:w-6 sm:h-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                    ) : (
                      <div className="flex flex-col items-center space-y-1">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d={mode === "login" ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" : "M13 7l5 5m0 0l-5 5m5-5H6"} 
                          />
                        </svg>
                        <span className="text-xs text-blue-600 font-medium hidden sm:block">
                           {mode === "login" ? "Connecter" : "Accéder"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
            {/* Ajouter la secrétaire dans la liste pour login rapide */}
            {mode === 'login' && (
              <button
                onClick={() => handleDoctorAction({ credentials: { email: 'secretaire@lineup.com', password: 'secretaire123' } })}
                disabled={isLoading}
                className={`
                  w-full p-4 rounded-xl transition-all duration-200 border-2 text-left
                  bg-white hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 text-purple-900 border-purple-300 hover:border-purple-400 hover:shadow-md transform hover:scale-[1.02]
                  ${isLoading ? 'opacity-50 cursor-wait' : ''}
                `}
                aria-label="Se connecter en tant que secrétaire"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center text-2xl flex-shrink-0 border-2 border-purple-200">
                    <ShieldPlus className="w-6 h-6 text-purple-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-purple-900 truncate text-lg">Secrétaire</p>
                    <p className="text-sm text-purple-700 mb-1">Accès secrétaire (démo)</p>
                  </div>
                </div>
              </button>
            )}
          </div>

          <div className="mt-4 p-3 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-300 rounded-lg">
            <p className="text-xs text-yellow-800 text-center">
              {mode === "login" 
                ? "⚠️ Mode développement : Ces connexions rapides sont uniquement pour les tests et la démonstration."
                : "⚡ Accès instantané : Connectez-vous directement sans saisir vos identifiants"
              }
            </p>
          </div>
        </div>
      )}
    </div>
  );
} 