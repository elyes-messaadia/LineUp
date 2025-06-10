import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DOCTEURS } from '../config/doctors';
import { useToast } from '../hooks/useToast';
import BACKEND_URL from '../config/api';

export default function DoctorQuickAccess() {
  const [isLoading, setIsLoading] = useState(false);
  const [showDoctorAccess, setShowDoctorAccess] = useState(false);
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const handleDoctorLogin = async (doctor) => {
    setIsLoading(true);

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
      setIsLoading(false);
    }
  };

  return (
    <div className="mb-6">
      <button
        onClick={() => setShowDoctorAccess(!showDoctorAccess)}
        className="w-full p-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
        type="button"
        aria-expanded={showDoctorAccess}
        aria-controls="doctor-access-section"
      >
        <div className="flex items-center justify-center space-x-3">
          <span className="text-2xl">👨‍⚕️</span>
          <span>Accès rapide médecins</span>
          <svg 
            className={`w-5 h-5 transition-transform duration-200 ${showDoctorAccess ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {showDoctorAccess && (
        <div 
          id="doctor-access-section"
          className="mt-4 bg-gradient-to-br from-white to-blue-50 border-2 border-blue-200 rounded-xl p-4 shadow-lg animate-in"
          role="region"
          aria-label="Accès rapide pour les médecins"
        >
          <div className="text-center mb-4">
            <h3 className="font-bold text-blue-900 text-lg mb-2">
              🩺 Espace médecins
            </h3>
            <p className="text-sm text-blue-700">
              Accédez directement à votre tableau de bord médical
            </p>
          </div>
          
          <div className="grid gap-3">
            {DOCTEURS.map((doctor) => (
              <button
                key={doctor.id}
                onClick={() => handleDoctorLogin(doctor)}
                disabled={isLoading || !doctor.disponible}
                className={`
                  w-full p-4 rounded-xl transition-all duration-200 border-2 text-left
                  ${doctor.disponible 
                    ? 'bg-white hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 text-blue-900 border-blue-300 hover:border-blue-400 hover:shadow-md transform hover:scale-[1.02]' 
                    : 'bg-gray-100 text-gray-500 border-gray-300 cursor-not-allowed'
                  }
                  ${isLoading ? 'opacity-50 cursor-wait' : ''}
                `}
                aria-label={`Accéder au dashboard de ${doctor.fullName}`}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center text-2xl flex-shrink-0 border-2 border-blue-200">
                    {doctor.emoji}
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
                        {doctor.disponible ? 'Disponible aujourd\'hui' : 'Non disponible'}
                      </span>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {isLoading ? (
                      <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                    ) : (
                      <div className="flex flex-col items-center space-y-1">
                        <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                        <span className="text-xs text-blue-600 font-medium">Accéder</span>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-4 p-3 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-300 rounded-lg">
            <p className="text-xs text-yellow-800 text-center">
              ⚡ <strong>Accès instantané :</strong> Connectez-vous directement sans saisir vos identifiants
            </p>
          </div>
        </div>
      )}
    </div>
  );
} 