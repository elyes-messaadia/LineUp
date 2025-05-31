import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import AnimatedPage from "../components/AnimatedPage";
import Title from "../components/Title";
import Toast from "../components/Toast";
import ConfirmModal from "../components/ConfirmModal";
import { useToast } from "../hooks/useToast";

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const { toasts, showSuccess, showError, showInfo, removeToast } = useToast();

  useEffect(() => {
    // Vérifier l'authentification
    const userData = localStorage.getItem("user");
    const authStatus = localStorage.getItem("isAuthenticated");
    
    if (userData && authStatus) {
      setUser(JSON.parse(userData));
      setIsAuthenticated(true);
    }
  }, []);

  const handleTakeTicket = () => {
    if (isAuthenticated && user) {
      // Si connecté, vérifier le rôle
      if (user.role.name === "visiteur") {
        showInfo("En tant que visiteur, vous ne pouvez pas prendre de ticket. Créez un compte Patient.");
        return;
      }
      if (user.role.name === "patient") {
        // Rediriger vers le dashboard patient
        navigate("/dashboard/patient");
        return;
      }
      if (["medecin", "secretaire"].includes(user.role.name)) {
        // Les médecins/secrétaires peuvent créer des tickets via leur dashboard
        navigate(`/dashboard/${user.role.name}`);
        return;
      }
    }
    
    // Mode anonyme (ancien système)
    setShowTicketModal(true);
  };

  const confirmTakeTicket = async () => {
    setShowTicketModal(false);
    setIsLoading(true);

    try {
      showInfo("Création de votre ticket en cours...");
      
      const res = await fetch(`${import.meta.env.VITE_API_URL}/ticket`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        throw new Error(`Erreur ${res.status}`);
      }

      const data = await res.json();
      localStorage.setItem("lineup_ticket", JSON.stringify(data));
      
      showSuccess(`Ticket n°${data.number} créé avec succès !`, 4000);
      
      setTimeout(() => {
        navigate("/ticket");
      }, 1500);

    } catch (error) {
      console.error("Erreur création ticket:", error);
      showError("Impossible de créer le ticket. Veuillez réessayer.", 5000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <AnimatedPage>
        <div className="text-center">
          <Title>🏥 LineUp</Title>
          <p className="text-base sm:text-lg text-gray-600 mb-8 px-4 leading-relaxed">
            Système de gestion de file d'attente médicale intelligente
          </p>

          {/* Section utilisateur connecté */}
          {isAuthenticated && user && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 mx-4 sm:mx-0">
              <div className="flex items-center justify-center gap-2 mb-3">
                <span className="text-2xl">
                  {user.role?.name === "medecin" && "🩺"}
                  {user.role?.name === "secretaire" && "👩‍💼"}
                  {user.role?.name === "patient" && "👤"}
                  {user.role?.name === "visiteur" && "👁️"}
                </span>
                <h2 className="text-lg font-semibold text-blue-800">
                  Bienvenue {user.fullName || `${user.firstName} ${user.lastName}`}
                </h2>
              </div>
              <p className="text-blue-600 text-sm mb-4">
                Connecté en tant que <strong>{
                  user.role?.name === "medecin" ? "Médecin" :
                  user.role?.name === "secretaire" ? "Secrétaire" :
                  user.role?.name === "patient" ? "Patient" :
                  user.role?.name === "visiteur" ? "Visiteur" : "Utilisateur"
                }</strong>
              </p>
              <button
                onClick={() => navigate(`/dashboard/${user.role.name}`)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium w-full sm:w-auto"
              >
                📊 Accéder à mon espace
              </button>
            </div>
          )}

          {/* Actions principales */}
          <div className="space-y-4 mb-8 px-4 sm:px-0">
            {!isAuthenticated ? (
              // Mode non connecté
              <>
                <button
                  onClick={handleTakeTicket}
                  disabled={isLoading}
                  className={`w-full sm:w-auto bg-blue-600 text-white px-6 py-4 rounded-lg hover:bg-blue-700 transition font-medium text-base sm:text-lg ${
                    isLoading ? "bg-gray-400 cursor-not-allowed" : ""
                  }`}
                >
                  {isLoading ? (
                    <>
                      <span className="animate-spin inline-block mr-2">⏳</span>
                      Création en cours...
                    </>
                  ) : (
                    "🎟️ Prendre un ticket (mode anonyme)"
                  )}
                </button>

                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-4">
                    Ou connectez-vous pour une expérience personnalisée
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      onClick={() => navigate("/login")}
                      className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-medium"
                    >
                      🔐 Se connecter
                    </button>
                    <button
                      onClick={() => navigate("/register")}
                      className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition font-medium"
                    >
                      ✨ Créer un compte
                    </button>
                  </div>
                </div>
              </>
            ) : (
              // Mode connecté
              <div className="space-y-3">
                {user.role?.name === "patient" && (
                  <button
                    onClick={handleTakeTicket}
                    disabled={isLoading}
                    className="w-full sm:w-auto bg-blue-600 text-white px-6 py-4 rounded-lg hover:bg-blue-700 transition font-medium text-base sm:text-lg"
                  >
                    🎟️ Prendre un ticket de consultation
                  </button>
                )}
                
                {["medecin", "secretaire"].includes(user.role?.name) && (
                  <button
                    onClick={handleTakeTicket}
                    className="w-full sm:w-auto bg-green-600 text-white px-6 py-4 rounded-lg hover:bg-green-700 transition font-medium text-base sm:text-lg"
                  >
                    ⚙️ Gérer la file d'attente
                  </button>
                )}

                {user.role?.name === "visiteur" && (
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-3">
                      En tant que visiteur, vous pouvez consulter la file d'attente
                    </p>
                    <button
                      onClick={() => navigate("/register")}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
                    >
                      ✨ Devenir patient pour prendre des tickets
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Navigation rapide */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 px-4 sm:px-0">
            <button
              onClick={() => navigate("/queue")}
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition font-medium"
            >
              📋 Voir la file d'attente
            </button>

            {!isAuthenticated && (
              <button
                onClick={() => navigate("/ticket")}
                className="bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-700 transition font-medium"
              >
                🎫 Mon ticket actuel
              </button>
            )}

            {isAuthenticated && (
              <button
                onClick={() => navigate(`/dashboard/${user.role.name}`)}
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition font-medium"
              >
                📊 Mon tableau de bord
              </button>
            )}
          </div>

          {/* Informations système */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mx-4 sm:mx-0">
            <h3 className="font-semibold text-gray-800 mb-3">ℹ️ À propos du système</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600">
              <div className="space-y-2">
                <p><strong>🩺 Médecins :</strong> Gestion complète des consultations</p>
                <p><strong>👩‍💼 Secrétaires :</strong> Assistance et coordination</p>
              </div>
              <div className="space-y-2">
                <p><strong>👤 Patients :</strong> Prise de tickets et suivi</p>
                <p><strong>👁️ Visiteurs :</strong> Consultation temps d'attente</p>
              </div>
            </div>
            
            {!isAuthenticated && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-800">
                  💡 <strong>Nouveau :</strong> Créez un compte pour bénéficier de fonctionnalités avancées,
                  notifications en temps réel et historique de vos consultations.
                </p>
              </div>
            )}
          </div>

          {/* Comptes de test (mode développement) */}
          {import.meta.env.DEV && (
            <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg mx-4 sm:mx-0">
              <h3 className="font-semibold text-yellow-800 mb-2">🧪 Comptes de test</h3>
              <div className="text-xs text-yellow-700 space-y-1">
                <p><strong>Médecin :</strong> medecin@lineup.com / medecin123</p>
                <p><strong>Secrétaire :</strong> secretaire@lineup.com / secretaire123</p>
                <p><strong>Patient :</strong> patient@lineup.com / patient123</p>
                <p><strong>Visiteur :</strong> visiteur@lineup.com / visiteur123</p>
              </div>
            </div>
          )}

          {/* Modal de confirmation pour ticket anonyme */}
          <ConfirmModal
            isOpen={showTicketModal}
            title="Prendre un ticket anonyme"
            message="Voulez-vous prendre un ticket en mode anonyme ? Pour une meilleure expérience, nous recommandons de créer un compte."
            confirmText="Oui, continuer en anonyme"
            cancelText="Créer un compte"
            type="info"
            onConfirm={confirmTakeTicket}
            onCancel={() => {
              setShowTicketModal(false);
              navigate("/register");
            }}
          />

          {/* Notifications Toast */}
          {toasts.map(toast => (
            <Toast
              key={toast.id}
              message={toast.message}
              type={toast.type}
              duration={toast.duration}
              onClose={() => removeToast(toast.id)}
            />
          ))}
        </div>
      </AnimatedPage>
    </Layout>
  );
}
