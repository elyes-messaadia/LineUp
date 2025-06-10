import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import AnimatedPage from "../../components/AnimatedPage";
import Toast from "../../components/Toast";
import ConfirmModal from "../../components/ConfirmModal";
import { useToast } from "../../hooks/useToast";
import BACKEND_URL from "../../config/api";
import { getDoctorDashboardRoute } from "../../utils/doctorMapping";

export default function MedecinDashboard() {
  const [user, setUser] = useState(null);
  const [queue, setQueue] = useState([]);
  const [currentPatient, setCurrentPatient] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [stats, setStats] = useState({});
  const navigate = useNavigate();
  const { toasts, showSuccess, showError, showWarning, showInfo, removeToast } = useToast();

  useEffect(() => {
    const userData = localStorage.getItem("user");
    const isAuthenticated = localStorage.getItem("isAuthenticated");

    if (!userData || !isAuthenticated) {
      navigate("/login");
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role.name !== "medecin") {
      navigate("/login");
      return;
    }

    setUser(parsedUser);

    // Rediriger vers le dashboard spécifique du médecin
    const specificDashboard = getDoctorDashboardRoute(parsedUser);
    console.log(`Redirection médecin ${parsedUser.username || parsedUser.email} vers ${specificDashboard}`);
    
    if (specificDashboard !== "/dashboard/medecin") {
      navigate(specificDashboard, { replace: true });
    }

    fetchQueue();

    // Actualiser toutes les secondes
    const interval = setInterval(() => {
      fetchQueue();
    }, 1000);

    return () => clearInterval(interval);
  }, [navigate]);

  const fetchQueue = async () => {
    try {
      // Essayer de trouver l'ID docteur pour ce médecin
      const { getDoctorIdFromUser } = await import("../../utils/doctorMapping");
      const doctorId = getDoctorIdFromUser(user);
      
      let res;
      if (doctorId) {
        // Si on peut identifier le docteur, charger sa file spécifique
        res = await fetch(`${BACKEND_URL}/queue?docteur=${doctorId}`);
      } else {
        // Sinon, charger la file globale (comportement de fallback)
        res = await fetch(`${BACKEND_URL}/queue`);
      }
      
      if (res.ok) {
        const data = await res.json();
        setQueue(data);
        
        // Trouver le patient en consultation
        const inConsultation = data.find(t => t.status === "en_consultation");
        setCurrentPatient(inConsultation);

        // Calculer les statistiques avec les données fraîches
        const today = data.filter(t => {
          const ticketDate = new Date(t.createdAt);
          const todayDate = new Date();
          return ticketDate.toDateString() === todayDate.toDateString();
        });

        setStats({
          waitingCount: data.filter(t => t.status === "en_attente").length,
          inConsultationCount: data.filter(t => t.status === "en_consultation").length,
          completedToday: today.filter(t => t.status === "termine").length,
          cancelledToday: today.filter(t => t.status === "desiste").length,
          totalToday: today.length
        });
      }
    } catch (error) {
      // Silencieux pour ne pas spam les erreurs
    }
  };

  const handleCallNext = () => {
    const nextPatient = queue
      .filter(t => t.status === "en_attente")
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))[0];

    if (!nextPatient) {
      showWarning("Aucun patient en attente");
      return;
    }

    if (currentPatient) {
      showWarning("Un patient est déjà en consultation. Terminez d'abord cette consultation.");
      return;
    }

    setShowCallModal(true);
  };

  // Fonction pour jouer le son de notification
  const playNotificationSound = () => {
    const audio = new Audio("/notify.mp3");
    audio.play().catch(() => {});
  };

  const confirmCallNext = async () => {
    setShowCallModal(false);
    setIsLoading(true);

    try {
      showInfo("Appel du patient suivant...");

      // Essayer de trouver l'ID docteur pour ce médecin
      const { getDoctorIdFromUser } = await import("../../utils/doctorMapping");
      const doctorId = getDoctorIdFromUser(user);
      
      let url = `${BACKEND_URL}/next`;
      if (doctorId) {
        url = `${BACKEND_URL}/next?docteur=${doctorId}`;
      }

      const res = await fetch(url, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Erreur ${res.status}`);
      }

      const data = await res.json();
      playNotificationSound(); // Jouer le son quand on appelle un patient
      showSuccess(`Patient n°${data.called.ticket.number} appelé en consultation !`, 4000);
      fetchQueue();

    } catch (error) {
      console.error("Erreur appel patient:", error);
      showError(error.message || "Impossible d'appeler le patient suivant", 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinishConsultation = () => {
    if (!currentPatient) {
      showWarning("Aucun patient en consultation");
      return;
    }
    setShowFinishModal(true);
  };

  const confirmFinishConsultation = async () => {
    if (!currentPatient) return;

    setShowFinishModal(false);
    setIsLoading(true);

    try {
      showInfo("Finalisation de la consultation...");

      const res = await fetch(`${BACKEND_URL}/ticket/${currentPatient._id}/finish`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      });

      if (!res.ok) {
        throw new Error(`Erreur ${res.status}`);
      }

      showSuccess(`Consultation du patient n°${currentPatient.number} terminée !`, 4000);
      setCurrentPatient(null);
      fetchQueue();

    } catch (error) {
      console.error("Erreur fin consultation:", error);
      showError("Impossible de terminer la consultation", 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetQueue = () => {
    if (queue.filter(t => t.status === "en_attente").length === 0) {
      showInfo("Aucun patient en attente à supprimer");
      return;
    }
    setShowResetModal(true);
  };

  const confirmResetQueue = async () => {
    setShowResetModal(false);
    setIsLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/queue/reset`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      });

      if (!res.ok) {
        throw new Error(`Erreur ${res.status}`);
      }

      const data = await res.json();
      showSuccess(`✅ ${data.message} - ${data.deletedCount} ticket(s) supprimé(s)`, 5000);
      fetchQueue();

    } catch (error) {
      console.error("Erreur reset:", error);
      showError("Impossible de réinitialiser la file", 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("isAuthenticated");
    showInfo("Déconnexion réussie");
    navigate("/");
  };

  const getEstimatedTime = (position) => {
    const avgConsultationTime = 15; // 15 minutes par consultation
    const totalMinutes = position * avgConsultationTime;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours > 0) {
      return `${hours}h${minutes.toString().padStart(2, '0')}`;
    }
    return `${minutes} min`;
  };

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

  const nextPatient = queue
    .filter(t => t.status === "en_attente")
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))[0];

  return (
    <Layout>
      <AnimatedPage>
        <div className="dashboard-container container-safe overflow-protection">
          {/* En-tête du dashboard */}
          <div className="dashboard-card mb-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div>
                <h1 className="dashboard-title text-blue-800 text-overflow-safe">
                  👨‍⚕️ Interface Médecin
                </h1>
                <p className="dashboard-subtitle text-overflow-safe">
                  Bienvenue Dr. {user.lastName || user.firstName || user.email?.split('@')[0] || 'Médecin'}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setDisponible(!disponible)}
                  className={`action-button text-overflow-safe ${
                    disponible ? 'action-button-success' : 'action-button-danger'
                  }`}
                >
                  {disponible ? '✅ Disponible' : '⏸️ En pause'}
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="action-button action-button-secondary text-overflow-safe"
                >
                  🏠 Accueil
                </button>
              </div>
            </div>
          </div>

          <Toast toasts={toasts} onRemoveToast={removeToast} />

          {/* Consultation actuelle */}
          {currentPatient && (
            <div className="dashboard-section">
              <h2 className="dashboard-section-title text-overflow-safe">Consultation en cours</h2>
              <div className="alert-card bg-blue-50 border-l-4 border-blue-400">
                <div className="info-grid">
                  <div>
                    <p className="text-responsive-sm text-blue-600 text-overflow-safe">Patient</p>
                    <p className="text-responsive-lg font-semibold text-blue-800 text-overflow-safe">
                      {currentPatient.nom} {currentPatient.prenom}
                    </p>
                  </div>
                  <div>
                    <p className="text-responsive-sm text-blue-600 text-overflow-safe">Ticket</p>
                    <p className="text-responsive-lg font-semibold text-blue-800 text-overflow-safe">
                      #{currentPatient.numeroTicket}
                    </p>
                  </div>
                  <div>
                    <p className="text-responsive-sm text-blue-600 text-overflow-safe">Heure d'arrivée</p>
                    <p className="text-responsive-lg font-semibold text-blue-800 text-overflow-safe">
                      {new Date(currentPatient.heureArrivee).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-responsive-sm text-blue-600 text-overflow-safe">Durée consultation</p>
                    <p className="text-responsive-lg font-semibold text-blue-800 text-overflow-safe">
                      {currentPatient.dureeConsultation || 'En cours...'}
                    </p>
                  </div>
                </div>
                
                <div className="mt-4 actions-grid">
                  <button
                    onClick={handleFinishConsultation}
                    className="action-button action-button-success text-overflow-safe"
                  >
                    ✅ Terminer la consultation
                  </button>
                  <button
                    onClick={() => setShowNotesModal(true)}
                    className="action-button action-button-secondary text-overflow-safe"
                  >
                    📝 Ajouter des notes
                  </button>
                  <button
                    onClick={() => setPauseConsultation(true)}
                    className="action-button action-button-secondary text-overflow-safe"
                  >
                    ⏸️ Mettre en pause
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Aperçu du prochain patient */}
          {nextPatient && (
            <div className="dashboard-section">
              <h2 className="dashboard-section-title text-overflow-safe">Prochain patient</h2>
              <div className="dashboard-card">
                <div className="info-grid">
                  <div>
                    <p className="text-responsive-sm text-gray-500 text-overflow-safe">Nom</p>
                    <p className="text-responsive-lg font-semibold text-overflow-safe">
                      {nextPatient.nom} {nextPatient.prenom}
                    </p>
                  </div>
                  <div>
                    <p className="text-responsive-sm text-gray-500 text-overflow-safe">Ticket</p>
                    <p className="text-responsive-lg font-semibold text-overflow-safe">
                      #{nextPatient.numeroTicket}
                    </p>
                  </div>
                  <div>
                    <p className="text-responsive-sm text-gray-500 text-overflow-safe">Position</p>
                    <p className="text-responsive-lg font-semibold text-overflow-safe">
                      1ère position
                    </p>
                  </div>
                  <div>
                    <p className="text-responsive-sm text-gray-500 text-overflow-safe">Temps d'attente</p>
                    <p className="text-responsive-lg font-semibold text-overflow-safe">
                      {getEstimatedTime(queue.indexOf(nextPatient) + 1)}
                    </p>
                  </div>
                </div>
                
                <div className="mt-4 actions-grid">
                  <button
                    onClick={handleCallNext}
                    disabled={!disponible}
                    className="action-button action-button-primary text-overflow-safe"
                  >
                    📞 Appeler ce patient
                  </button>
                  <button
                    onClick={() => setShowHistoriquePatientModal(true)}
                    className="action-button action-button-secondary text-overflow-safe"
                  >
                    📋 Voir l'historique
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Statistiques personnelles */}
          <div className="dashboard-section">
            <h2 className="dashboard-section-title text-overflow-safe">Mes statistiques du jour</h2>
            <div className="stats-grid">
              <div className="stats-card">
                <div className="stats-number text-blue-600 text-overflow-safe">{stats.waitingCount}</div>
                <div className="stats-label text-overflow-safe">Patients en attente</div>
              </div>
              
              <div className="stats-card">
                <div className="stats-number text-green-600 text-overflow-safe">{stats.inConsultationCount}</div>
                <div className="stats-label text-overflow-safe">Patients consultés</div>
              </div>
              
              <div className="stats-card">
                <div className="stats-number text-orange-600 text-overflow-safe">{stats.completedToday}</div>
                <div className="stats-label text-overflow-safe">Consultations terminées aujourd'hui</div>
              </div>
              
              <div className="stats-card">
                <div className="stats-number text-purple-600 text-overflow-safe">{stats.totalToday}</div>
                <div className="stats-label text-overflow-safe">Total du jour</div>
              </div>
            </div>
          </div>

          {/* Ma file d'attente */}
          <div className="dashboard-section">
            <h2 className="dashboard-section-title text-overflow-safe">Ma file d'attente</h2>
            
            {queue.length > 0 ? (
              <div className="dashboard-grid">
                {queue.map((ticket, index) => (
                  <div key={ticket._id} className={`ticket-card ${index === 0 ? 'border-blue-500 bg-blue-50' : ''}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-responsive-lg font-semibold text-overflow-safe">
                          Position #{index + 1}
                          {index === 0 && (
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Prochain
                            </span>
                          )}
                        </h3>
                        <p className="text-responsive-base text-gray-600 text-overflow-safe">
                          {ticket.nom} {ticket.prenom}
                        </p>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-overflow-safe ${
                          ticket.status === 'appelé' ? 'bg-green-100 text-green-800' :
                          ticket.status === 'en_cours' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {getStatusDisplay(ticket.status)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="info-grid">
                      <div>
                        <p className="text-responsive-sm text-gray-500 text-overflow-safe">Ticket</p>
                        <p className="text-responsive-base font-medium text-overflow-safe">#{ticket.numero}</p>
                      </div>
                      <div>
                        <p className="text-responsive-sm text-gray-500 text-overflow-safe">Temps d'attente</p>
                        <p className="text-responsive-base font-medium text-overflow-safe">
                          {getEstimatedTime(index + 1)}
                        </p>
                      </div>
                      <div>
                        <p className="text-responsive-sm text-gray-500 text-overflow-safe">Priorité</p>
                        <p className="text-responsive-base font-medium text-overflow-safe">
                          {ticket.priorite || 'Normale'}
                        </p>
                      </div>
                      <div>
                        <p className="text-responsive-sm text-gray-500 text-overflow-safe">Arrivé à</p>
                        <p className="text-responsive-base font-medium text-overflow-safe">
                          {new Date(ticket.createdAt).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    
                    {/* Indicateurs visuels */}
                    {ticket.priorite === 'urgente' && (
                      <div className="mt-2 p-2 bg-red-50 border-l-4 border-red-400 rounded">
                        <p className="text-responsive-sm text-red-700 text-overflow-safe">
                          🚨 Consultation urgente
                        </p>
                      </div>
                    )}
                    
                    {ticket.notes && (
                      <div className="mt-2 p-2 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                        <p className="text-responsive-sm text-yellow-700 text-overflow-safe">
                          📝 {ticket.notes}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="dashboard-card text-center">
                <div className="text-4xl mb-4">🎯</div>
                <h3 className="text-responsive-lg font-semibold text-gray-800 mb-2 text-overflow-safe">
                  Aucun patient en attente
                </h3>
                <p className="text-responsive-base text-gray-600 text-overflow-safe">
                  Votre file d'attente est actuellement vide.
                </p>
              </div>
            )}
          </div>

          {/* Actions rapides */}
          <div className="dashboard-section">
            <h2 className="dashboard-section-title text-overflow-safe">Actions rapides</h2>
            <div className="actions-grid">
              <button
                onClick={rafraichirDonnees}
                disabled={loading}
                className="action-button action-button-primary text-overflow-safe"
              >
                {loading ? 'Actualisation...' : '🔄 Actualiser'}
              </button>
              
              <button
                onClick={() => setShowPlanningModal(true)}
                className="action-button action-button-secondary text-overflow-safe"
              >
                📅 Mon planning
              </button>
              
              <button
                onClick={() => setShowStatistiquesModal(true)}
                className="action-button action-button-secondary text-overflow-safe"
              >
                📊 Statistiques détaillées
              </button>
              
              <button
                onClick={() => setShowParametresModal(true)}
                className="action-button action-button-secondary text-overflow-safe"
              >
                ⚙️ Paramètres
              </button>
            </div>
          </div>

          {/* Messages */}
          {erreur && (
            <div className="alert-card bg-red-50 border-l-4 border-red-400 text-overflow-safe">
              <div className="p-1">
                <p className="text-responsive-base text-red-800 text-overflow-safe">
                  ❌ {erreur}
                </p>
              </div>
            </div>
          )}

          {message && (
            <div className="alert-card bg-green-50 border-l-4 border-green-400 text-overflow-safe">
              <div className="p-1">
                <p className="text-responsive-base text-green-800 text-overflow-safe">
                  ✅ {message}
                </p>
              </div>
            </div>
          )}

          {/* Modal notes */}
          {showNotesModal && (
            <div className="modal-overlay-fullscreen animate-overlay">
              <div className="modal-responsive animate-in bg-white p-6 rounded-lg shadow-xl">
                <h2 className="dashboard-title mb-4 text-overflow-safe">Ajouter des notes de consultation</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-responsive-base font-medium text-gray-700 mb-2 text-overflow-safe">
                      Notes sur la consultation
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows="6"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-overflow-safe"
                      placeholder="Saisissez vos notes de consultation..."
                    />
                  </div>

                  <div>
                    <label className="block text-responsive-base font-medium text-gray-700 mb-2 text-overflow-safe">
                      Diagnostic ou observations
                    </label>
                    <textarea
                      value={diagnostic}
                      onChange={(e) => setDiagnostic(e.target.value)}
                      rows="4"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-overflow-safe"
                      placeholder="Diagnostic, traitement prescrit..."
                    />
                  </div>

                  <div className="actions-grid">
                    <button
                      onClick={sauvegarderNotes}
                      disabled={loading}
                      className="action-button action-button-primary text-overflow-safe"
                    >
                      {loading ? 'Sauvegarde...' : '💾 Sauvegarder'}
                    </button>
                    <button
                      onClick={() => setShowNotesModal(false)}
                      className="action-button action-button-secondary text-overflow-safe"
                    >
                      ❌ Annuler
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modal planning */}
          {showPlanningModal && (
            <div className="modal-overlay-fullscreen animate-overlay">
              <div className="modal-responsive animate-in bg-white p-6 rounded-lg shadow-xl max-w-4xl">
                <h2 className="dashboard-title mb-4 text-overflow-safe">Mon planning de la journée</h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="dashboard-section-title text-overflow-safe">Rendez-vous programmés</h3>
                    {planning.rendezVous.length > 0 ? (
                      <div className="space-y-3">
                        {planning.rendezVous.map((rdv, index) => (
                          <div key={index} className="ticket-card">
                            <div className="info-grid">
                              <div>
                                <p className="text-responsive-sm text-gray-500 text-overflow-safe">Heure</p>
                                <p className="text-responsive-base font-medium text-overflow-safe">{rdv.heure}</p>
                              </div>
                              <div>
                                <p className="text-responsive-sm text-gray-500 text-overflow-safe">Patient</p>
                                <p className="text-responsive-base font-medium text-overflow-safe">{rdv.patient}</p>
                              </div>
                              <div>
                                <p className="text-responsive-sm text-gray-500 text-overflow-safe">Type</p>
                                <p className="text-responsive-base font-medium text-overflow-safe">{rdv.type}</p>
                              </div>
                              <div>
                                <p className="text-responsive-sm text-gray-500 text-overflow-safe">Statut</p>
                                <p className="text-responsive-base font-medium text-overflow-safe">{rdv.statut}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-responsive-base text-gray-600 text-overflow-safe">
                        Aucun rendez-vous programmé aujourd'hui.
                      </p>
                    )}
                  </div>

                  <div>
                    <h3 className="dashboard-section-title text-overflow-safe">Heures de disponibilité</h3>
                    <div className="info-grid">
                      <div className="stats-card">
                        <div className="stats-number text-green-600 text-overflow-safe">{planning.heuresDisponibles.debut}</div>
                        <div className="stats-label text-overflow-safe">Début de journée</div>
                      </div>
                      <div className="stats-card">
                        <div className="stats-number text-red-600 text-overflow-safe">{planning.heuresDisponibles.fin}</div>
                        <div className="stats-label text-overflow-safe">Fin de journée</div>
                      </div>
                      <div className="stats-card">
                        <div className="stats-number text-blue-600 text-overflow-safe">{planning.pauseDejeneur.debut}-{planning.pauseDejeneur.fin}</div>
                        <div className="stats-label text-overflow-safe">Pause déjeuner</div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <button
                      onClick={() => setShowPlanningModal(false)}
                      className="action-button action-button-secondary w-full text-overflow-safe"
                    >
                      ✅ Fermer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </AnimatedPage>
    </Layout>
  );
} 