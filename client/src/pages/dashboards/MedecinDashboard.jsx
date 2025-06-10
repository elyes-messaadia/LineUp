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
        <div className="dashboard-container overflow-protection">
          {/* En-tête médecin moderne */}
          <div className="dashboard-card mb-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div>
                <h1 className="dashboard-title text-blue-800">
                  👨‍⚕️ Espace Médecin
                </h1>
                <p className="dashboard-subtitle">
                  Dr. {user.lastName || user.firstName || user.email?.split('@')[0] || 'Médecin'}
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

          {/* Statut consultation actuelle */}
          {currentPatient ? (
            <div className="alert-card bg-green-50 border border-green-200 mb-6">
              <h3 className="text-responsive-lg font-semibold text-green-800 mb-3">
                🩺 Patient en consultation
              </h3>
              <div className="info-grid">
                <div className="stats-card border-green-300">
                  <span className="text-responsive-sm text-green-600 font-medium">Ticket n°</span>
                  <p className="stats-number text-green-800">{currentPatient.number}</p>
                </div>
                <div className="stats-card border-green-300">
                  <span className="text-responsive-sm text-green-600 font-medium">Depuis</span>
                  <p className="text-responsive-base text-green-700">
                    {new Date(currentPatient.updatedAt).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
              <button
                onClick={handleFinishConsultation}
                disabled={isLoading}
                className="action-button action-button-success w-full mt-4"
              >
                ✅ Terminer la consultation
              </button>
            </div>
          ) : (
            <div className="alert-card bg-blue-50 border border-blue-200 mb-6">
              <h3 className="text-responsive-lg font-semibold text-blue-800 mb-3">
                💤 Aucune consultation en cours
              </h3>
              <p className="text-responsive-base text-blue-700 mb-4">
                Vous êtes disponible pour recevoir le prochain patient
              </p>
              {nextPatient && (
                <button
                  onClick={handleCallNext}
                  disabled={isLoading}
                  className="action-button action-button-primary w-full"
                >
                  📢 Appeler le patient suivant (#{nextPatient.number})
                </button>
              )}
            </div>
          )}

          {/* Statistiques du jour modernes */}
          <div className="dashboard-card mb-6">
            <h2 className="dashboard-title text-gray-800 mb-4">
              📊 Statistiques de ma consultation
            </h2>
            <div className="stats-grid">
              <div className="stats-card border-blue-200 accessible-shadow">
                <div className="stats-number text-blue-600">{stats.waitingCount}</div>
                <div className="stats-label">En attente</div>
              </div>
              <div className="stats-card border-yellow-200 accessible-shadow">
                <div className="stats-number text-yellow-600">{stats.inConsultationCount}</div>
                <div className="stats-label">En consultation</div>
              </div>
              <div className="stats-card border-green-200 accessible-shadow">
                <div className="stats-number text-green-600">{stats.completedToday}</div>
                <div className="stats-label">Terminées aujourd'hui</div>
              </div>
              <div className="stats-card border-purple-200 accessible-shadow">
                <div className="stats-number text-purple-600">{stats.totalToday}</div>
                <div className="stats-label">Total du jour</div>
              </div>
            </div>
          </div>

          {/* Prochain patient */}
          {nextPatient && (
            <div className="dashboard-card mb-6">
              <h3 className="text-responsive-lg font-semibold text-gray-800 mb-4">
                ⏭️ Prochain patient
              </h3>
              <div className="info-grid">
                <div className="stats-card border-blue-200">
                  <span className="text-responsive-sm text-blue-600 font-medium">Ticket n°</span>
                  <p className="stats-number text-blue-800">{nextPatient.number}</p>
                </div>
                <div className="stats-card border-blue-200">
                  <span className="text-responsive-sm text-blue-600 font-medium">Attente depuis</span>
                  <p className="text-responsive-base text-blue-700">
                    {new Date(nextPatient.createdAt).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions principales modernes */}
          <div className="dashboard-card mb-6">
            <h3 className="text-responsive-lg font-semibold text-gray-800 mb-4">⚡ Actions principales</h3>
            <div className="actions-grid">
              <button
                onClick={handleCallNext}
                disabled={isLoading || !nextPatient || currentPatient}
                className="action-button action-button-primary text-center"
              >
                📢 Appeler le suivant
              </button>

              <button
                onClick={handleFinishConsultation}
                disabled={isLoading || !currentPatient}
                className="action-button action-button-success text-center"
              >
                ✅ Terminer consultation
              </button>

              <button
                onClick={() => navigate("/queue")}
                className="action-button action-button-secondary text-center"
              >
                📋 Voir la file complète
              </button>

              <button
                onClick={handleResetQueue}
                disabled={isLoading}
                className="action-button action-button-danger text-center"
              >
                🗑️ Réinitialiser la file
              </button>
            </div>
          </div>

          {/* File d'attente résumée */}
          <div className="dashboard-card">
            <h3 className="text-responsive-lg font-semibold text-gray-800 mb-4">
              📋 Ma file d'attente
            </h3>
            
            {queue.filter(t => t.status === "en_attente").length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">🎯</div>
                <p className="text-responsive-base">Aucun patient en attente</p>
                <p className="text-responsive-sm mt-2">Profitez de cette pause !</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {queue
                  .filter(t => t.status === "en_attente")
                  .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
                  .map((ticket, index) => (
                    <div key={ticket._id} className={`ticket-card ${
                      index === 0 ? "bg-green-50 border-green-200" : "bg-blue-50 border-blue-200"
                    }`}>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                        <div className="flex items-center gap-3">
                          <span className="text-responsive-base font-semibold text-gray-800">
                            🎫 Ticket n°{ticket.number}
                          </span>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                            index === 0 ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                          }`}>
                            {index === 0 ? "⬅️ SUIVANT" : `Position ${index + 1}`}
                          </div>
                        </div>
                        
                        <div className="flex flex-col sm:items-end gap-1">
                          <div className="text-responsive-sm text-gray-500">
                            ⏰ {new Date(ticket.createdAt).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                          <div className="text-responsive-sm text-gray-600">
                            Attente: {getEstimatedTime(index + 1)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Modales responsives */}
          <ConfirmModal
            isOpen={showCallModal}
            title="📢 Appeler le patient suivant"
            message="Êtes-vous prêt à recevoir le patient suivant ?"
            onConfirm={confirmCallNext}
            onCancel={() => setShowCallModal(false)}
            confirmText="Oui, appeler"
            cancelText="Pas encore"
            isLoading={isLoading}
          />

          <ConfirmModal
            isOpen={showFinishModal}
            title="✅ Terminer la consultation"
            message={`Voulez-vous marquer la consultation du patient n°${currentPatient?.number} comme terminée ?`}
            onConfirm={confirmFinishConsultation}
            onCancel={() => setShowFinishModal(false)}
            confirmText="Oui, terminer"
            cancelText="Continuer"
            isLoading={isLoading}
          />

          <ConfirmModal
            isOpen={showResetModal}
            title="🚨 Réinitialiser la file"
            message="⚠️ ATTENTION : Cette action supprimera TOUS les patients en attente de manière irréversible. Êtes-vous absolument certain ?"
            onConfirm={confirmResetQueue}
            onCancel={() => setShowResetModal(false)}
            confirmText="Oui, supprimer tout"
            cancelText="Annuler"
            isLoading={isLoading}
          />
        </div>
      </AnimatedPage>
    </Layout>
  );
} 