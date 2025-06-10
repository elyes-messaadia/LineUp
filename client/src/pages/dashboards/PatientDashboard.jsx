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
        <div className="dashboard-container container-safe overflow-protection">
          {/* En-tête du dashboard */}
          <div className="mb-6">
            <h1 className="dashboard-title text-overflow-safe">
              Bienvenue, {user.nom} {user.prenom}
            </h1>
            <p className="dashboard-subtitle text-overflow-safe">
              Votre numéro de patient : {user.numero}
            </p>
          </div>

          {/* Affichage du ticket actuel si il y en a un */}
          {myTicket && (
            <div className="alert-card bg-blue-50 border-l-4 border-blue-400 text-overflow-safe">
              <div className="p-1">
                <div className="flex items-center">
                  <div className="flex-1 min-w-0">
                    <p className="text-responsive-lg font-medium text-blue-800 text-overflow-safe">
                      Ticket en cours : #{myTicket.number}
                    </p>
                    <p className="text-responsive-base text-blue-700 text-overflow-safe">
                      {myTicket.status === 'appelé' ? '🔔 Vous êtes appelé(e) !' : 
                       myTicket.status === 'en_cours' ? '⏳ Consultation en cours' : 
                       `📍 Position dans la file : ${myPosition || 'N/A'}`}
                    </p>
                    <p className="text-responsive-sm text-blue-600 text-overflow-safe">
                      Docteur {getDoctorDisplayName(myTicket.docteur) || myTicket.docteur}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Informations détaillées du ticket actuel */}
          {myTicket && (
            <div className="dashboard-section">
              <h2 className="dashboard-section-title text-overflow-safe">Informations de votre consultation</h2>
              <div className="info-grid">
                <div className="stats-card">
                  <div className="stats-number text-overflow-safe">#{myTicket.number}</div>
                  <div className="stats-label text-overflow-safe">Numéro de ticket</div>
                </div>
                
                <div className="stats-card">
                  <div className="stats-number text-overflow-safe">{myPosition || 'N/A'}</div>
                  <div className="stats-label text-overflow-safe">Position dans la file</div>
                </div>
                
                <div className="stats-card">
                  <div className="stats-number text-overflow-safe">{myTicket.status === 'appelé' ? '🔔 Vous êtes appelé(e) !' : 
                   myTicket.status === 'en_cours' ? '⏳ Consultation en cours' : 
                   `📍 Position dans la file : ${myPosition || 'N/A'}`}</div>
                  <div className="stats-label text-overflow-safe">Statut actuel</div>
                </div>
                
                <div className="stats-card">
                  <div className="stats-number text-overflow-safe">{myTicket.tempsAttenteEstime || 'Calcul...'}</div>
                  <div className="stats-label text-overflow-safe">Temps d'attente estimé</div>
                </div>
              </div>
            </div>
          )}

          {/* Statistiques de la file d'attente */}
          {queue && (
            <div className="dashboard-section">
              <h2 className="dashboard-section-title text-overflow-safe">État de la file d'attente</h2>
              <div className="stats-grid">
                <div className="stats-card">
                  <div className="stats-number text-blue-600 text-overflow-safe">{waitingCount}</div>
                  <div className="stats-label text-overflow-safe">Patients en attente</div>
                </div>
                
                <div className="stats-card">
                  <div className="stats-number text-green-600 text-overflow-safe">{queue.filter(t => t.status === "en_consultation").length}</div>
                  <div className="stats-label text-overflow-safe">Consultations en cours</div>
                </div>
                
                <div className="stats-card">
                  <div className="stats-number text-orange-600 text-overflow-safe">{queue.filter(t => t.status === "termine").length}</div>
                  <div className="stats-label text-overflow-safe">Terminés</div>
                </div>
              </div>
            </div>
          )}

          {/* Actions disponibles */}
          <div className="dashboard-section">
            <h2 className="dashboard-section-title text-overflow-safe">Actions disponibles</h2>
            <div className="actions-grid">
              {!myTicket ? (
                <button
                  onClick={handleTakeTicket}
                  className="action-button action-button-primary text-overflow-safe"
                  disabled={isLoading}
                >
                  {isLoading ? 'Traitement...' : '🎫 Prendre un ticket'}
                </button>
              ) : (
                <button
                  onClick={handleCancelTicket}
                  className="action-button action-button-danger text-overflow-safe"
                  disabled={isLoading}
                >
                  {isLoading ? 'Traitement...' : '❌ Annuler mon ticket'}
                </button>
              )}

              <button
                onClick={loadQueue}
                className="action-button action-button-secondary text-overflow-safe"
                disabled={isLoading}
              >
                {isLoading ? 'Actualisation...' : '🔄 Actualiser'}
              </button>
              
              <button
                onClick={() => navigate('/')}
                className="action-button action-button-secondary text-overflow-safe"
              >
                🏠 Retour à l'accueil
              </button>
            </div>
          </div>

          {/* Navigation vers autres dashboards */}
          <div className="dashboard-section">
            <h2 className="dashboard-section-title text-overflow-safe">Informations complémentaires</h2>
            <div className="dashboard-nav">
              <button
                onClick={() => navigate('/notifications')}
                className="action-button action-button-secondary text-overflow-safe"
              >
                ℹ️ Informations pratiques
              </button>
              
              <button
                onClick={() => navigate('/historique')}
                className="action-button action-button-secondary text-overflow-safe"
              >
                📋 Mon historique
              </button>
            </div>
          </div>

          {/* Message d'erreur */}
          {toasts.length > 0 && (
            <div className="alert-card bg-red-50 border-l-4 border-red-400 text-overflow-safe">
              <div className="p-1">
                <p className="text-responsive-base text-red-800 text-overflow-safe">
                  ❌ {toasts[toasts.length - 1].message}
                </p>
              </div>
            </div>
          )}

          {/* Message de succès */}
          {toasts.length > 0 && toasts[toasts.length - 1].type === 'success' && (
            <div className="alert-card bg-green-50 border-l-4 border-green-400 text-overflow-safe">
              <div className="p-1">
                <p className="text-responsive-base text-green-800 text-overflow-safe">
                  ✅ {toasts[toasts.length - 1].message}
                </p>
              </div>
            </div>
          )}

          {/* Modal pour prendre un ticket */}
          {showTicketModal && (
            <div className="modal-overlay-fullscreen animate-overlay">
              <div className="modal-responsive animate-in bg-white p-6 rounded-lg shadow-xl">
                <h2 className="dashboard-title mb-4 text-overflow-safe">Prendre un ticket</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-responsive-base font-medium text-gray-700 mb-2 text-overflow-safe">
                      Choisir un docteur
                    </label>
                    <select
                      value={selectedDoctor}
                      onChange={(e) => setSelectedDoctor(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-overflow-safe"
                      required
                    >
                      <option value="">-- Sélectionner un docteur --</option>
                      {DOCTEURS.filter(doctor => doctor.disponible).map((doctor) => (
                        <option key={doctor.value} value={doctor.value} className="text-overflow-safe">
                          Dr. {doctor.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="actions-grid">
                    <button
                      onClick={confirmTakeTicket}
                      disabled={!selectedDoctor || isLoading}
                      className="action-button action-button-primary text-overflow-safe"
                    >
                      {isLoading ? 'Création...' : '✅ Confirmer'}
                    </button>
                    <button
                      onClick={() => {
                        setShowTicketModal(false);
                        setSelectedDoctor('');
                      }}
                      className="action-button action-button-secondary text-overflow-safe"
                    >
                      ❌ Annuler
                    </button>
                  </div>
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