import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import AnimatedPage from "../../components/AnimatedPage";
import Toast from "../../components/Toast";
import ConfirmModal from "../../components/ConfirmModal";
import DoctorQueueSelector from "../../components/DoctorQueueSelector";
import ResetQueueButton from "../../components/ResetQueueButton";
import { useToast } from "../../hooks/useToast";
import BACKEND_URL from "../../config/api";
import { getDoctorDisplayName } from "../../config/doctors";

export default function SecretaireDashboard() {
  const [user, setUser] = useState(null);
  const [queue, setQueue] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null); // null = toutes les files
  const [selectedDoctorForTicket, setSelectedDoctorForTicket] = useState('dr-husni-said-habibi'); // Docteur par défaut pour nouveaux tickets
  const [selectedDoctorForCall, setSelectedDoctorForCall] = useState(null); // Docteur pour appel patient
  const [isLoading, setIsLoading] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [showCreateTicketModal, setShowCreateTicketModal] = useState(false);
  const [stats, setStats] = useState({});
  const [allStats, setAllStats] = useState({}); // Statistiques par docteur
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
    if (parsedUser.role.name !== "secretaire") {
      navigate("/login");
      return;
    }

    setUser(parsedUser);
    fetchQueue();
    fetchStats();

    // Actualiser toutes les 5 secondes
    const interval = setInterval(() => {
      fetchQueue();
      fetchStats();
    }, 5000);

    return () => clearInterval(interval);
  }, [navigate, selectedDoctor]); // Ajouter selectedDoctor comme dépendance

  const fetchQueue = async () => {
    try {
      // Charger la file selon le docteur sélectionné
      let url = `${BACKEND_URL}/queue`;
      if (selectedDoctor) {
        url += `?docteur=${selectedDoctor}`;
      }
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setQueue(data);
        fetchStats();
        fetchAllStats();
      }
    } catch (error) {
      console.error("Erreur chargement queue:", error);
    }
  };

  const fetchAllStats = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/stats`);
      if (res.ok) {
        const data = await res.json();
        setAllStats(data);
      }
    } catch (error) {
      console.error("Erreur chargement statistiques:", error);
    }
  };

  const fetchStats = () => {
    const today = queue.filter(t => {
      const ticketDate = new Date(t.createdAt);
      const today = new Date();
      return ticketDate.toDateString() === today.toDateString();
    });

    setStats({
      waitingCount: queue.filter(t => t.status === "en_attente").length,
      inConsultationCount: queue.filter(t => t.status === "en_consultation").length,
      completedToday: today.filter(t => t.status === "termine").length,
      cancelledToday: today.filter(t => t.status === "desiste").length,
      totalToday: today.length,
      averageWaitTime: today.length > 0 ? Math.round(today.length * 15) : 0 // 15 min par patient
    });
  };

  const handleCallNext = (doctorId = null) => {
    // Si un docteur spécifique est demandé
    if (doctorId) {
      const doctorQueue = queue.filter(t => t.docteur === doctorId);
      const nextPatient = doctorQueue
        .filter(t => t.status === "en_attente")
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))[0];

      if (!nextPatient) {
        showWarning(`Aucun patient en attente pour ${getDoctorDisplayName(doctorId)}`);
        return;
      }

      const currentPatient = doctorQueue.find(t => t.status === "en_consultation");
      if (currentPatient) {
        showWarning(`${getDoctorDisplayName(doctorId)} a déjà un patient en consultation.`);
        return;
      }

      setSelectedDoctorForCall(doctorId);
      setShowCallModal(true);
      return;
    }

    // Logique globale si aucun docteur spécifique
    const nextPatient = queue
      .filter(t => t.status === "en_attente")
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))[0];

    if (!nextPatient) {
      showWarning("Aucun patient en attente");
      return;
    }

    // Vérifier si le docteur de ce patient est libre
    const doctorQueue = queue.filter(t => t.docteur === nextPatient.docteur);
    const currentPatient = doctorQueue.find(t => t.status === "en_consultation");
    if (currentPatient) {
      showWarning(`${getDoctorDisplayName(nextPatient.docteur)} a déjà un patient en consultation.`);
      return;
    }

    setSelectedDoctorForCall(nextPatient.docteur);
    setShowCallModal(true);
  };

  const confirmCallNext = async () => {
    setShowCallModal(false);
    setIsLoading(true);

    try {
      showInfo("Appel du patient suivant...");

      if (!selectedDoctorForCall) {
        throw new Error("Aucun docteur sélectionné");
      }

      const res = await fetch(`${BACKEND_URL}/next?docteur=${selectedDoctorForCall}`, {
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
      showSuccess(`Patient n°${data.called.ticket.number} appelé en consultation pour ${getDoctorDisplayName(selectedDoctorForCall)} !`, 4000);
      fetchQueue();

    } catch (error) {
      console.error("Erreur appel patient:", error);
      showError(error.message || "Impossible d'appeler le patient suivant", 5000);
    } finally {
      setIsLoading(false);
      setSelectedDoctorForCall(null);
    }
  };

  const handleCreateTicket = () => {
    setShowCreateTicketModal(true);
  };

  const confirmCreateTicket = async () => {
    setShowCreateTicketModal(false);
    setIsLoading(true);

    try {
      showInfo("Création d'un ticket patient...");

      const res = await fetch(`${BACKEND_URL}/ticket`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ 
          docteur: selectedDoctorForTicket,
          anonymous: true
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Erreur ${res.status}`);
      }

      const data = await res.json();
      showSuccess(`Ticket n°${data.number} créé pour ${getDoctorDisplayName(selectedDoctorForTicket)} !`, 4000);
      fetchQueue();

    } catch (error) {
      console.error("Erreur création ticket:", error);
      showError(error.message || "Impossible de créer le ticket", 5000);
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

  const handleResetComplete = (result) => {
    showSuccess(result.message, 4000);
    fetchQueue();
  };

  const handleResetError = (error) => {
    showError(error, 5000);
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

  return (
    <Layout>
      <AnimatedPage>
        <div className="dashboard-container overflow-protection">
          {/* En-tête secrétaire moderne */}
          <div className="dashboard-card mb-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div>
                <h1 className="dashboard-title text-pink-800">
                  👩‍💼 Espace Secrétaire
                </h1>
                <p className="dashboard-subtitle">
                  Bienvenue {user.fullName || 
                            (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : '') ||
                            user.firstName || 
                            user.lastName || 
                            user.email?.split('@')[0] || 
                            'utilisateur'}
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

          {/* Sélecteur de file d'attente par docteur */}
          <div className="dashboard-section">
            <DoctorQueueSelector 
              selectedDoctor={selectedDoctor}
              onDoctorChange={setSelectedDoctor}
            />
          </div>

          {/* Sélection docteur pour créer un ticket - Modernisé */}
          <div className="dashboard-card mb-6">
            <h3 className="text-responsive-lg font-semibold text-blue-800 mb-3">
              🎟️ Création de ticket
            </h3>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <span className="text-responsive-base text-blue-700">Docteur pour le nouveau ticket :</span>
              <select
                value={selectedDoctorForTicket}
                onChange={(e) => setSelectedDoctorForTicket(e.target.value)}
                className="px-3 py-2 border border-blue-300 rounded-md bg-white text-blue-800 text-responsive-base min-w-48"
              >
                <option value="dr-husni-said-habibi">{getDoctorDisplayName('dr-husni-said-habibi')}</option>
                <option value="dr-helios-blasco">{getDoctorDisplayName('dr-helios-blasco')}</option>
                <option value="dr-jean-eric-panacciulli">{getDoctorDisplayName('dr-jean-eric-panacciulli')}</option>
              </select>
            </div>
          </div>

          {/* Statistiques du jour - Grid moderne */}
          <div className="dashboard-card mb-6">
            <h2 className="dashboard-title text-gray-800 mb-4">
              📊 Statistiques du jour
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
                <div className="stats-label">Terminées</div>
              </div>
              <div className="stats-card border-red-200 accessible-shadow">
                <div className="stats-number text-red-600">{stats.cancelledToday}</div>
                <div className="stats-label">Annulées</div>
              </div>
              <div className="stats-card border-purple-200 accessible-shadow">
                <div className="stats-number text-purple-600">{stats.totalToday}</div>
                <div className="stats-label">Total du jour</div>
              </div>
              <div className="stats-card border-orange-200 accessible-shadow">
                <div className="stats-number text-orange-600">{stats.averageWaitTime}</div>
                <div className="stats-label">Attente (min)</div>
              </div>
            </div>
          </div>

          {/* Actions principales modernes */}
          <div className="dashboard-card mb-6">
            <h3 className="text-responsive-lg font-semibold text-gray-800 mb-4">⚡ Actions principales</h3>
            <div className="actions-grid">
              <button
                onClick={handleCreateTicket}
                disabled={isLoading}
                className="action-button action-button-primary text-center"
              >
                <div>🎟️ Créer un ticket</div>
                <div className="text-responsive-sm opacity-75 mt-1">
                  pour {getDoctorDisplayName(selectedDoctorForTicket)}
                </div>
              </button>

              <button
                onClick={() => handleCallNext()}
                disabled={isLoading}
                className="action-button action-button-success text-center"
              >
                <div>📢 Appeler le suivant</div>
                <div className="text-responsive-sm opacity-75 mt-1">
                  (prochain global)
                </div>
              </button>

              <button
                onClick={() => navigate("/queue")}
                className="action-button action-button-primary text-center"
              >
                📋 File complète
              </button>

              <button
                onClick={() => navigate("/admin")}
                className="action-button action-button-secondary text-center"
              >
                ⚙️ Gestion admin
              </button>

              {/* Bouton de réinitialisation intégré */}
              <div className="flex items-center justify-center">
                <ResetQueueButton
                  selectedDoctor={selectedDoctor}
                  onResetComplete={handleResetComplete}
                  onError={handleResetError}
                  className="action-button action-button-danger w-full h-full flex flex-col items-center justify-center"
                />
              </div>
            </div>
          </div>

          {/* Actions par docteur modernes */}
          <div className="dashboard-card mb-6">
            <h3 className="text-responsive-lg font-semibold text-gray-800 mb-4">📢 Appels par médecin</h3>
            <div className="dashboard-grid">
              <button
                onClick={() => handleCallNext('dr-husni-said-habibi')}
                disabled={isLoading}
                className="action-button action-button-secondary border-orange-200 text-orange-800 hover:bg-orange-50 text-center"
              >
                <div>📞 Dr. Husni</div>
                <div className="text-responsive-sm opacity-75 mt-1">
                  Appeler le suivant
                </div>
              </button>
              
              <button
                onClick={() => handleCallNext('dr-helios-blasco')}
                disabled={isLoading}
                className="action-button action-button-secondary border-teal-200 text-teal-800 hover:bg-teal-50 text-center"
              >
                <div>📞 Dr. Helios</div>
                <div className="text-responsive-sm opacity-75 mt-1">
                  Appeler le suivant
                </div>
              </button>
              
              <button
                onClick={() => handleCallNext('dr-jean-eric-panacciulli')}
                disabled={isLoading}
                className="action-button action-button-secondary border-cyan-200 text-cyan-800 hover:bg-cyan-50 text-center"
              >
                <div>📞 Dr. Jean-Eric</div>
                <div className="text-responsive-sm opacity-75 mt-1">
                  Appeler le suivant
                </div>
              </button>
            </div>
          </div>

          {/* État actuel par docteur moderne */}
          <div className="dashboard-card mb-6">
            <h3 className="text-responsive-lg font-semibold text-gray-800 mb-4">👨‍⚕️ État des consultations par médecin</h3>
            <div className="dashboard-grid">
              {['dr-husni-said-habibi', 'dr-helios-blasco', 'dr-jean-eric-panacciulli'].map(doctorId => {
                const doctorQueue = queue.filter(t => t.docteur === doctorId);
                const inConsultation = doctorQueue.find(t => t.status === "en_consultation");
                const waiting = doctorQueue.filter(t => t.status === "en_attente");
                const nextPatient = waiting.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))[0];
                
                return (
                  <div key={doctorId} className="dashboard-card bg-gray-50">
                    <h4 className="text-responsive-base font-semibold text-gray-800 mb-3">
                      {getDoctorDisplayName(doctorId)}
                    </h4>
                    
                    <div className="space-y-3">
                      {/* Patient en consultation */}
                      {inConsultation ? (
                        <div className="alert-card bg-yellow-50 border border-yellow-200">
                          <div className="text-responsive-sm text-yellow-800 font-medium">🩺 En consultation</div>
                          <div className="text-responsive-sm text-yellow-700 mt-1">
                            Ticket n°{inConsultation.number}
                          </div>
                        </div>
                      ) : (
                        <div className="alert-card bg-green-50 border border-green-200">
                          <div className="text-responsive-sm text-green-800 font-medium">✅ Libre</div>
                        </div>
                      )}

                      {/* Patient suivant */}
                      {nextPatient ? (
                        <div className="alert-card bg-blue-50 border border-blue-200">
                          <div className="text-responsive-sm text-blue-800 font-medium">⏳ Prochain patient</div>
                          <div className="text-responsive-sm text-blue-700 mt-1">
                            Ticket n°{nextPatient.number}
                          </div>
                        </div>
                      ) : (
                        <div className="alert-card bg-gray-50 border border-gray-200">
                          <div className="text-responsive-sm text-gray-600">Aucun patient en attente</div>
                        </div>
                      )}

                      {/* Nombre en attente */}
                      <div className="info-grid">
                        <div className="stats-card border-gray-200">
                          <div className="stats-number text-gray-600">{waiting.length}</div>
                          <div className="stats-label">En attente</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Queue détaillée si sélectionnée */}
          {selectedDoctor && (
            <div className="dashboard-card">
              <h3 className="text-responsive-lg font-semibold text-gray-800 mb-4">
                📋 File de {getDoctorDisplayName(selectedDoctor)}
              </h3>
              {queue.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">🎯</div>
                  <p className="text-responsive-base">Aucun patient dans cette file</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {queue.map((ticket, index) => (
                    <div key={ticket._id} className="ticket-card">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                        <div className="flex items-center gap-3">
                          <span className="text-responsive-base font-semibold text-gray-800">
                            🎫 Ticket n°{ticket.number}
                          </span>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                            ticket.status === "en_consultation" ? "bg-green-100 text-green-700" :
                            ticket.status === "en_attente" ? "bg-blue-100 text-blue-700" :
                            ticket.status === "termine" ? "bg-gray-100 text-gray-700" :
                            "bg-red-100 text-red-700"
                          }`}>
                            {ticket.status === "en_attente" ? "En attente" :
                             ticket.status === "en_consultation" ? "En consultation" :
                             ticket.status === "termine" ? "Terminé" : "Annulé"}
                          </div>
                        </div>
                        
                        <div className="flex flex-col sm:items-end gap-1">
                          <div className="text-responsive-sm text-gray-500">
                            ⏰ {new Date(ticket.createdAt).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                          {ticket.status === "en_attente" && (
                            <div className="text-responsive-sm text-blue-600">
                              Position {queue.filter(t => t.status === "en_attente").findIndex(t => t._id === ticket._id) + 1}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Modales responsives */}
          <ConfirmModal
            isOpen={showCallModal}
            title="📢 Appeler le patient suivant"
            message={`Êtes-vous sûr de vouloir appeler le patient suivant pour ${getDoctorDisplayName(selectedDoctorForCall)} ?`}
            onConfirm={confirmCallNext}
            onCancel={() => {
              setShowCallModal(false);
              setSelectedDoctorForCall(null);
            }}
            confirmText="Oui, appeler"
            cancelText="Annuler"
            isLoading={isLoading}
          />

          <ConfirmModal
            isOpen={showCreateTicketModal}
            title="🎟️ Créer un nouveau ticket"
            message={`Créer un ticket pour ${getDoctorDisplayName(selectedDoctorForTicket)} ?`}
            onConfirm={confirmCreateTicket}
            onCancel={() => setShowCreateTicketModal(false)}
            confirmText="Créer le ticket"
            cancelText="Annuler"
            isLoading={isLoading}
          />
        </div>
      </AnimatedPage>
    </Layout>
  );
} 