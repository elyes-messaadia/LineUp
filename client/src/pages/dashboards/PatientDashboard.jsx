import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import AnimatedPage from "../../components/AnimatedPage";
import Toast from "../../components/Toast";
import ConfirmModal from "../../components/ConfirmModal";
import DashboardHeader from "../../components/DashboardHeader";
import { useToast } from "../../hooks/useToast";
import BACKEND_URL from "../../config/api";
import UserDebugPanel from "../../components/UserDebugPanel";
import { DOCTEURS, getDoctorDisplayName } from "../../config/doctors";
import { getDisplayName } from "../../utils/userUtils";
import NotificationSettings from "../../components/NotificationSettings";
import PushTestPanel from "../../components/PushTestPanel";

export default function PatientDashboard() {
  const [user, setUser] = useState(null);
  const [myTicket, setMyTicket] = useState(null);
  const [queue, setQueue] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const navigate = useNavigate();
  const { toasts, showSuccess, showError, showWarning, showInfo, removeToast } = useToast();



  const loadQueue = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/queue`);
      if (res.ok) {
        const data = await res.json();
        setQueue(data);
      }
    } catch (error) {
      console.error("Erreur chargement queue:", error);
    }
  }, []);

  const loadMyTicket = useCallback(() => {
    const stored = localStorage.getItem("lineup_ticket");
    if (stored) {
      try {
        const parsedTicket = JSON.parse(stored);
        setMyTicket(parsedTicket);
      } catch (error) {
        localStorage.removeItem("lineup_ticket");
      }
    }
  }, []);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    const isAuthenticated = localStorage.getItem("isAuthenticated");

    if (!userData || !isAuthenticated) {
      navigate("/login");
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role.name !== "patient") {
      navigate("/login");
      return;
    }

    setUser(parsedUser);
    loadMyTicket();
    loadQueue();

    // Actualiser toutes les 3 secondes
    const interval = setInterval(() => {
      loadMyTicket();
      loadQueue();
    }, 3000);

    return () => clearInterval(interval);
  }, [navigate, loadMyTicket, loadQueue]);

  const handleTakeTicket = () => {
    if (myTicket) {
      showWarning("Vous avez déjà un ticket en cours !");
      return;
    }
    setShowTicketModal(true);
  };

  const confirmTakeTicket = async () => {
    if (!selectedDoctor) {
      showError("Veuillez sélectionner un médecin");
      return;
    }

    const selectedDoctorInfo = DOCTEURS.find(d => d.value === selectedDoctor);
    if (!selectedDoctorInfo.disponible) {
      showError("Ce médecin n'est pas disponible aujourd'hui");
      return;
    }

    setShowTicketModal(false);
    setIsLoading(true);

    try {
      showInfo(`Création de votre ticket pour ${selectedDoctorInfo.label}...`);
      
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Token d'authentification manquant. Veuillez vous reconnecter.");
      }
      
      const res = await fetch(`${BACKEND_URL}/ticket`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ 
          userId: user._id,
          docteur: selectedDoctor
        })
      });

      if (!res.ok) {
        let errorMessage = `Erreur ${res.status}`;
        try {
          const errorData = await res.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // Ignore si on ne peut pas parser la réponse
        }
        throw new Error(errorMessage);
      }

      const data = await res.json();
      localStorage.setItem("lineup_ticket", JSON.stringify(data));
      setMyTicket(data);
      
      showSuccess(`Ticket n°${data.number} créé pour ${selectedDoctorInfo.label} !`, 4000);
      setSelectedDoctor(""); // Réinitialiser la sélection
      loadQueue();

    } catch (error) {
      console.error("Erreur création ticket:", error);
      
      if (error.message.includes("401") || error.message.includes("Token")) {
        showError("Session expirée. Veuillez vous reconnecter.", 5000);
        handleLogout();
      } else if (error.message.includes("400")) {
        showError("Données invalides. Vérifiez votre profil.", 5000);
      } else {
        showError("Impossible de créer le ticket. Veuillez réessayer.", 5000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelTicket = () => {
    if (!myTicket) {
      showError("Aucun ticket à annuler");
      return;
    }
    
    if (myTicket.status === "en_consultation") {
      showWarning("Impossible d'annuler un ticket en consultation");
      return;
    }
    
    setShowCancelModal(true);
  };

  const confirmCancelTicket = async () => {
    if (!myTicket) return;

    setShowCancelModal(false);
    setIsLoading(true);

    try {
      showWarning("Annulation de votre ticket en cours...");

      const res = await fetch(`${BACKEND_URL}/ticket/${myTicket._id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      });

      if (res.ok || res.status === 404) {
        localStorage.removeItem("lineup_ticket");
        setMyTicket(null);
        showSuccess("Ticket annulé avec succès !", 4000);
        loadQueue();
      } else {
        throw new Error(`Erreur ${res.status}`);
      }

    } catch (error) {
      console.error("Erreur annulation:", error);
      showError("Impossible d'annuler le ticket. Veuillez réessayer.", 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("lineup_ticket");
    showInfo("Déconnexion réussie");
    navigate("/");
  };

  const getMyPosition = () => {
    if (!myTicket) return null;
    const activeTickets = queue.filter(t => t.status === "en_attente");
    const myIndex = activeTickets.findIndex(t => t._id === myTicket._id);
    return myIndex !== -1 ? myIndex + 1 : null;
  };

  const myPosition = getMyPosition();
  const waitingCount = queue.filter(t => t.status === "en_attente").length;

  if (!user) {
    return (
      <Layout>
        <AnimatedPage>
          <div className="text-center">
            <div className="animate-spin text-4xl mb-4">⏳</div>
            <p>Chargement...</p>
          </div>
        </AnimatedPage>
      </Layout>
    );
  }

  return (
    <Layout>
      <AnimatedPage>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 legacy-container">
          {/* En-tête utilisateur unifié */}
          <DashboardHeader
            title="Espace Patient"
            subtitle="Bienvenue {user}"
            icon="👤"
            user={user}
            onLogout={handleLogout}
            colorScheme="blue"
          />

          {/* Mon ticket actuel - Section responsive */}
          {myTicket ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
              <h2 className="text-lg sm:text-xl font-semibold text-yellow-800 mb-4 legacy-text-primary">
                🎫 Mon ticket actuel
              </h2>
              
              {/* Informations du ticket - Grid responsive */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
                <div className="bg-white rounded-lg p-3 border border-yellow-300">
                  <span className="text-xs sm:text-sm text-yellow-600 font-medium">Numéro</span>
                  <p className="text-lg sm:text-xl font-bold text-yellow-800">#{myTicket.number}</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-yellow-300">
                  <span className="text-xs sm:text-sm text-yellow-600 font-medium">Statut</span>
                  <p className="text-sm sm:text-base font-semibold text-yellow-800">
                    {myTicket.status === "en_attente" ? "⏱️ En attente" :
                     myTicket.status === "en_consultation" ? "🩺 En consultation" :
                     myTicket.status === "termine" ? "✅ Terminé" : "❌ Annulé"}
                  </p>
                </div>
                {myPosition && (
                  <div className="bg-white rounded-lg p-3 border border-yellow-300 sm:col-span-2">
                    <span className="text-xs sm:text-sm text-yellow-600 font-medium">Position dans la file</span>
                    <p className="text-lg sm:text-xl font-bold text-yellow-800">#{myPosition}</p>
                  </div>
                )}
                {myTicket.docteur && (
                  <div className="bg-white rounded-lg p-3 border border-yellow-300 sm:col-span-2">
                    <span className="text-xs sm:text-sm text-yellow-600 font-medium">Médecin assigné</span>
                    <p className="text-sm text-yellow-700 font-semibold">
                      👨‍⚕️ {getDoctorDisplayName(myTicket.docteur) || myTicket.docteur}
                    </p>
                  </div>
                )}
                <div className="bg-white rounded-lg p-3 border border-yellow-300 sm:col-span-2">
                  <span className="text-xs sm:text-sm text-yellow-600 font-medium">Créé le</span>
                  <p className="text-sm text-yellow-700">{new Date(myTicket.createdAt).toLocaleString()}</p>
                </div>
              </div>

              {/* Actions selon le statut */}
              {myTicket.status === "en_attente" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                  <button
                    onClick={() => navigate("/queue")}
                    className="
                      bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 
                      transition-colors font-medium text-sm sm:text-base
                      touch-target-large legacy-button
                    "
                  >
                    📋 Voir ma position en temps réel
                  </button>
                  <button
                    onClick={handleCancelTicket}
                    disabled={isLoading}
                    className="
                      bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 
                      transition-colors disabled:bg-gray-400 font-medium text-sm sm:text-base
                      touch-target-large legacy-button
                    "
                  >
                    ❌ Annuler mon ticket
                  </button>
                </div>
              )}

              {myTicket.status === "en_consultation" && (
                <div className="mt-4 p-4 bg-green-100 rounded-lg border border-green-300">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">🩺</div>
                    <div>
                      <p className="text-green-800 font-semibold text-sm sm:text-base">
                        Vous êtes en consultation !
                      </p>
                      <p className="text-green-700 text-xs sm:text-sm">
                        Rendez-vous chez le médecin
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg p-6 sm:p-8 mb-6 sm:mb-8 text-center">
              <div className="text-4xl sm:text-6xl mb-4">🎫</div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 legacy-text-primary">
                Aucun ticket actif
              </h2>
              <p className="text-sm sm:text-base text-gray-600 mb-6 legacy-text-secondary max-w-md mx-auto">
                Vous n'avez pas de ticket en cours. Prenez un ticket pour rejoindre la file d'attente.
              </p>
              <button
                onClick={handleTakeTicket}
                disabled={isLoading}
                className="
                  bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 
                  transition-colors disabled:bg-gray-400 font-medium text-sm sm:text-base
                  touch-target-large legacy-button w-full sm:w-auto
                "
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin inline-block mr-2">⏳</span>
                    Création...
                  </>
                ) : (
                  "🎟️ Prendre un ticket"
                )}
              </button>
            </div>
          )}

          {/* Statistiques de la file - Section responsive */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 legacy-text-primary">
              📊 État de la file d'attente
            </h3>
            
            {/* Grid des statistiques */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
              <div className="bg-white rounded-lg p-4 border border-blue-200 text-center">
                <div className="text-xl sm:text-2xl font-bold text-blue-600 mb-1">{waitingCount}</div>
                <div className="text-xs sm:text-sm text-gray-600 legacy-text-secondary">En attente</div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-green-200 text-center">
                <div className="text-xl sm:text-2xl font-bold text-green-600 mb-1">
                  {queue.filter(t => t.status === "en_consultation").length}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 legacy-text-secondary">En consultation</div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200 text-center col-span-2 sm:col-span-1">
                <div className="text-xl sm:text-2xl font-bold text-gray-600 mb-1">
                  {queue.filter(t => t.status === "termine").length}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 legacy-text-secondary">Terminés</div>
              </div>
            </div>
            
            <button
              onClick={() => navigate("/queue")}
              className="
                w-full bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700 
                transition-colors font-medium text-sm sm:text-base
                touch-target-large legacy-button
              "
            >
              📋 Voir la file complète
            </button>
          </div>

          {/* Paramètres des notifications */}
          <div className="mb-6 sm:mb-8">
            <NotificationSettings />
            <PushTestPanel />
          </div>

          {/* Actions rapides */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-3">⚡ Actions rapides</h3>
            <div className="space-y-2">
              <button
                onClick={() => navigate("/")}
                className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                🏠 Retour à l'accueil
              </button>
              <button
                onClick={() => navigate("/queue")}
                className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                📋 File d'attente en temps réel
              </button>
            </div>
          </div>

          {/* Modales */}
          {/* Modale améliorée de sélection de médecin */}
          {showTicketModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  🎫 Prendre un ticket de consultation
                </h3>
                
                <p className="text-gray-600 mb-6">
                  Choisissez le médecin que vous souhaitez consulter :
                </p>

                <div className="space-y-3 mb-6">
                  {DOCTEURS.map((docteur) => (
                    <label 
                      key={docteur.value}
                      className={`
                        flex items-center p-4 border rounded-lg cursor-pointer transition-all
                        ${selectedDoctor === docteur.value 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                        }
                        ${!docteur.disponible ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                    >
                      <input
                        type="radio"
                        name="doctor"
                        value={docteur.value}
                        checked={selectedDoctor === docteur.value}
                        onChange={(e) => setSelectedDoctor(e.target.value)}
                        disabled={!docteur.disponible}
                        className="sr-only"
                      />
                      <div className="flex items-center space-x-3 w-full">
                        <span className="text-2xl">{docteur.emoji}</span>
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">{docteur.label}</p>
                          <p className={`text-sm ${docteur.disponible ? 'text-green-600' : 'text-red-600'}`}>
                            {docteur.disponible ? '✅ Disponible aujourd\'hui' : '❌ Non disponible'}
                          </p>
                        </div>
                        {selectedDoctor === docteur.value && (
                          <div className="text-blue-500">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowTicketModal(false);
                      setSelectedDoctor("");
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={confirmTakeTicket}
                    disabled={!selectedDoctor || isLoading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isLoading ? "Création..." : "Confirmer"}
                  </button>
                </div>
              </div>
            </div>
          )}

          <ConfirmModal
            isOpen={showCancelModal}
            title="Annuler le ticket"
            message={`Êtes-vous sûr de vouloir annuler votre ticket n°${myTicket?.number} ? Cette action est irréversible.`}
            confirmText="Oui, annuler"
            cancelText="Non, garder mon ticket"
            type="danger"
            onConfirm={confirmCancelTicket}
            onCancel={() => setShowCancelModal(false)}
          />

          {/* Notifications */}
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