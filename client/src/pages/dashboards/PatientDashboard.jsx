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

  const loadMyTicket = useCallback(async () => {
    try {
      // D'abord, essayer de récupérer le ticket depuis le serveur (pour les patients connectés)
      const token = localStorage.getItem("token");
      if (token) {
        const res = await fetch(`${BACKEND_URL}/patient/my-ticket`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        
        if (res.ok) {
          const data = await res.json();
          setMyTicket(data.ticket);
          localStorage.setItem("lineup_ticket", JSON.stringify(data.ticket));
          return;
        } else if (res.status === 404) {
          // Aucun ticket actif côté serveur, nettoyer localStorage
          localStorage.removeItem("lineup_ticket");
          setMyTicket(null);
          return;
        }
      }
      
      // Fallback : chercher dans localStorage pour les tickets anonymes
      const stored = localStorage.getItem("lineup_ticket");
      if (stored) {
        try {
          const parsedTicket = JSON.parse(stored);
          // Vérifier que le ticket dans localStorage est encore valide
          if (parsedTicket.status === 'en_attente' || parsedTicket.status === 'en_consultation') {
            setMyTicket(parsedTicket);
          } else {
            // Ticket terminé/annulé, le supprimer
            localStorage.removeItem("lineup_ticket");
            setMyTicket(null);
          }
        } catch (error) {
          localStorage.removeItem("lineup_ticket");
          setMyTicket(null);
        }
      }
    } catch (error) {
      console.error("Erreur chargement ticket:", error);
      // En cas d'erreur réseau, ne pas utiliser localStorage pour éviter d'afficher de vieux tickets
      setMyTicket(null);
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
      
      // Vérifier la structure de la réponse et normaliser
      const ticketData = data.ticket || data; // Compatibilité avec les deux formats
      
      localStorage.setItem("lineup_ticket", JSON.stringify(ticketData));
      setMyTicket(ticketData);
      
      showSuccess(`Ticket n°${ticketData.number} créé pour ${selectedDoctorInfo.label} !`, 4000);
      setSelectedDoctor(""); // Réinitialiser la sélection
      loadQueue();

    } catch (error) {
      console.error("Erreur création ticket:", error);
      
      if (error.message.includes("401") || error.message.includes("Token")) {
        showError("Session expirée. Veuillez vous reconnecter.", 5000);
        handleLogout();
      } else if (error.message.includes("400")) {
        if (error.message.includes("déjà un ticket")) {
          showWarning("Vous avez déjà un ticket en cours ! Chargement...", 3000);
          // Recharger pour détecter le ticket existant
          setTimeout(() => {
            loadMyTicket();
            loadQueue();
          }, 1000);
        } else {
          showError("Données invalides. Vérifiez votre profil.", 5000);
        }
      } else if (error.message.includes("429")) {
        showWarning("Trop de demandes. Veuillez attendre quelques instants.", 3000);
      } else if (error.message.includes("500") || error.message.includes("502") || error.message.includes("503")) {
        showError("Erreur du serveur. Essayez dans quelques instants.", 5000);
      } else {
        showError(`Impossible de créer le ticket : ${error.message}`, 5000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelTicket = () => {
    if (!myTicket) {
      showError("Aucun ticket actif trouvé");
      return;
    }
    setShowCancelModal(true);
  };

  const confirmCancelTicket = async () => {
    setShowCancelModal(false);
    setIsLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/ticket/${myTicket._id}/cancel`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" }
      });

      if (res.ok) {
        localStorage.removeItem("lineup_ticket");
        setMyTicket(null);
        showSuccess("Ticket annulé avec succès");
        loadQueue(); // Actualiser la file
      } else {
        throw new Error("Erreur lors de l'annulation");
      }
    } catch (error) {
      console.error("Erreur annulation:", error);
      showError("Erreur lors de l'annulation du ticket");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("lineup_ticket");
    navigate("/");
  };

  const getMyPosition = () => {
    if (!myTicket || myTicket.status !== "en_attente") return null;
    
    const waitingTickets = queue
      .filter(t => t.status === "en_attente" && t.docteur === myTicket.docteur)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    
    const position = waitingTickets.findIndex(t => t._id === myTicket._id) + 1;
    return position > 0 ? position : null;
  };

  const myPosition = getMyPosition();
  const waitingCount = queue.filter(t => t.status === "en_attente").length;

  if (!user) {
    return (
      <Layout>
        <AnimatedPage>
          <div className="dashboard-container text-center">
            <div className="animate-spin text-4xl mb-4">⏳</div>
            <p className="text-responsive-base">Chargement...</p>
          </div>
        </AnimatedPage>
      </Layout>
    );
  }

  return (
    <Layout>
      <AnimatedPage>
        <div className="dashboard-container overflow-protection">
          {/* En-tête utilisateur moderne */}
          <div className="dashboard-card mb-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div>
                <h1 className="dashboard-title text-blue-800">
                  🩺 Espace Patient
                </h1>
                <p className="dashboard-subtitle">
                  Bienvenue {getDisplayName(user)} !
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="action-button action-button-secondary text-responsive-sm"
              >
                🔒 Déconnexion
              </button>
            </div>
          </div>

          <Toast toasts={toasts} onRemoveToast={removeToast} />

          <UserDebugPanel 
            currentUser={user} 
            currentTicket={myTicket}
            queue={queue}
          />

          {/* Mon ticket actuel - Section responsive moderne */}
          {myTicket ? (
            <div className="alert-card bg-yellow-50 border border-yellow-200">
              <h2 className="dashboard-title text-yellow-800 mb-4">
                🎫 Mon ticket actuel
              </h2>
              
              {/* Informations du ticket - Grid moderne */}
              <div className="info-grid mb-4">
                <div className="stats-card border-yellow-300">
                  <span className="text-responsive-sm text-yellow-600 font-medium">Numéro</span>
                  <p className="stats-number text-yellow-800">
                    #{myTicket.number || 'N/A'}
                  </p>
                </div>
                <div className="stats-card border-yellow-300">
                  <span className="text-responsive-sm text-yellow-600 font-medium">Statut</span>
                  <p className="text-responsive-base font-semibold text-yellow-800">
                    {myTicket.status === "en_attente" ? "⏱️ En attente" :
                     myTicket.status === "en_consultation" ? "🩺 En consultation" :
                     myTicket.status === "termine" ? "✅ Terminé" : 
                     myTicket.status === "desiste" ? "❌ Désisté" : "❌ Annulé"}
                  </p>
                </div>
                {myPosition && (
                  <div className="stats-card border-yellow-300 sm:col-span-2">
                    <span className="text-responsive-sm text-yellow-600 font-medium">Position dans la file</span>
                    <p className="stats-number text-yellow-800">#{myPosition}</p>
                  </div>
                )}
                {myTicket.docteur && (
                  <div className="stats-card border-yellow-300 sm:col-span-2">
                    <span className="text-responsive-sm text-yellow-600 font-medium">Médecin assigné</span>
                    <p className="text-responsive-base text-yellow-700 font-semibold">
                      👨‍⚕️ {getDoctorDisplayName(myTicket.docteur) || myTicket.docteur}
                    </p>
                  </div>
                )}
                <div className="stats-card border-yellow-300 sm:col-span-2">
                  <span className="text-responsive-sm text-yellow-600 font-medium">Créé le</span>
                  <p className="text-responsive-sm text-yellow-700">
                    {myTicket.createdAt ? 
                      new Date(myTicket.createdAt).toLocaleString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 
                      'Date non disponible'
                    }
                  </p>
                </div>
              </div>

              {/* Actions selon le statut */}
              {myTicket.status === "en_attente" && (
                <div className="dashboard-nav mt-4">
                  <button
                    onClick={() => navigate("/queue")}
                    className="action-button action-button-success w-full sm:w-auto"
                  >
                    📋 Voir ma position en temps réel
                  </button>
                  <button
                    onClick={handleCancelTicket}
                    disabled={isLoading}
                    className="action-button action-button-danger w-full sm:w-auto"
                  >
                    ❌ Annuler mon ticket
                  </button>
                </div>
              )}

              {myTicket.status === "en_consultation" && (
                <div className="mt-4 alert-card bg-green-100 border border-green-300">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">🩺</div>
                    <div>
                      <p className="text-green-800 font-semibold text-responsive-base">
                        Vous êtes en consultation !
                      </p>
                      <p className="text-green-700 text-responsive-sm">
                        Rendez-vous chez le médecin
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="dashboard-card text-center">
              <div className="text-4xl sm:text-6xl mb-4">🎫</div>
              <h2 className="dashboard-title text-gray-800 mb-3">
                Aucun ticket actif
              </h2>
              <p className="dashboard-subtitle mb-6 max-w-md mx-auto">
                Vous n'avez pas de ticket en cours. Prenez un ticket pour rejoindre la file d'attente.
              </p>
              <button
                onClick={handleTakeTicket}
                disabled={isLoading}
                className="action-button action-button-primary w-full sm:w-auto"
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

          {/* Statistiques de la file - Section moderne */}
          <div className="dashboard-card">
            <h3 className="dashboard-title text-gray-800 mb-4">
              📊 État de la file d'attente
            </h3>
            
            {/* Grid des statistiques modernes */}
            <div className="stats-grid mb-6">
              <div className="stats-card border-blue-200">
                <div className="stats-number text-blue-600">{waitingCount}</div>
                <div className="stats-label">En attente</div>
              </div>
              <div className="stats-card border-green-200">
                <div className="stats-number text-green-600">
                  {queue.filter(t => t.status === "en_consultation").length}
                </div>
                <div className="stats-label">En consultation</div>
              </div>
              <div className="stats-card border-gray-200">
                <div className="stats-number text-gray-600">
                  {queue.filter(t => t.status === "termine").length}
                </div>
                <div className="stats-label">Terminés</div>
              </div>
            </div>
            
            <button
              onClick={() => navigate("/queue")}
              className="action-button action-button-secondary w-full"
            >
              📋 Voir la file complète
            </button>
          </div>

          {/* Paramètres des notifications */}
          <div className="dashboard-section">
            <NotificationSettings />
            <PushTestPanel />
          </div>

          {/* Actions rapides modernes */}
          <div className="dashboard-card">
            <h3 className="text-responsive-lg font-semibold text-gray-800 mb-3">⚡ Actions rapides</h3>
            <div className="dashboard-nav">
              <button
                onClick={() => navigate("/")}
                className="action-button action-button-secondary text-left"
              >
                🏠 Retour à l'accueil
              </button>
              <button
                onClick={() => navigate("/queue")}
                className="action-button action-button-secondary text-left"
              >
                📋 File d'attente en temps réel
              </button>
            </div>
          </div>

          {/* Modales responsives */}
          {showTicketModal && (
            <div className="modal-overlay-fullscreen">
              <div className="modal-responsive bg-white rounded-lg p-6 accessible-shadow">
                <h3 className="dashboard-title text-gray-800 mb-4">
                  🎫 Prendre un ticket de consultation
                </h3>
                <p className="dashboard-subtitle mb-6">
                  Choisissez le médecin que vous souhaitez consulter :
                </p>
                
                <div className="space-y-3 mb-6">
                  {DOCTEURS.filter(doctor => doctor.disponible).map((doctor) => (
                    <label
                      key={doctor.value}
                      className={`
                        dashboard-card cursor-pointer transition-all
                        ${selectedDoctor === doctor.value ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'}
                      `}
                    >
                      <div className="flex items-center">
                        <input
                          type="radio"
                          name="doctor"
                          value={doctor.value}
                          checked={selectedDoctor === doctor.value}
                          onChange={(e) => setSelectedDoctor(e.target.value)}
                          className="mr-3 h-4 w-4 text-blue-600"
                        />
                        <div>
                          <div className="text-responsive-base font-medium text-gray-900">
                            {doctor.label}
                          </div>
                          <div className="text-responsive-sm text-gray-500">
                            {doctor.specialite}
                          </div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>

                <div className="dashboard-nav">
                  <button
                    onClick={confirmTakeTicket}
                    disabled={!selectedDoctor || isLoading}
                    className="action-button action-button-primary flex-1"
                  >
                    {isLoading ? (
                      <>
                        <span className="animate-spin mr-2">⏳</span>
                        Création...
                      </>
                    ) : (
                      "✅ Confirmer"
                    )}
                  </button>
                  <button
                    onClick={() => setShowTicketModal(false)}
                    disabled={isLoading}
                    className="action-button action-button-secondary flex-1"
                  >
                    ❌ Annuler
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modale de confirmation d'annulation */}
          <ConfirmModal
            isOpen={showCancelModal}
            title="🚨 Annuler mon ticket"
            message="Êtes-vous sûr de vouloir annuler votre ticket ? Cette action est irréversible."
            onConfirm={confirmCancelTicket}
            onCancel={() => setShowCancelModal(false)}
            confirmText="Oui, annuler"
            cancelText="Non, garder"
            isLoading={isLoading}
          />
        </div>
      </AnimatedPage>
    </Layout>
  );
} 