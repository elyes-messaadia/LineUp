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
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDoctorForTicket, setSelectedDoctorForTicket] = useState('dr-husni-said-habibi');
  const [selectedDoctorForCall, setSelectedDoctorForCall] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [showCreateTicketModal, setShowCreateTicketModal] = useState(false);
  const [stats, setStats] = useState({});
  const [allStats, setAllStats] = useState({});
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

    const interval = setInterval(() => {
      fetchQueue();
      fetchStats();
    }, 5000);

    return () => clearInterval(interval);
  }, [navigate, selectedDoctor]);

  const fetchQueue = async () => {
    try {
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
      averageWaitTime: today.length > 0 ? Math.round(today.length * 15) : 0
    });
  };

  const handleCallNext = (doctorId = null) => {
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

    const nextPatient = queue
      .filter(t => t.status === "en_attente")
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))[0];

    if (!nextPatient) {
      showWarning("Aucun patient en attente");
      return;
    }

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
        const errorMessage = errorData.message || `Erreur ${res.status}`;
        
        // Messages d'erreur personnalisés pour une meilleure UX
        if (errorMessage.includes("aucun patient")) {
          throw new Error("ℹ️ Aucun patient en attente pour ce médecin actuellement.");
        } else if (errorMessage.includes("déjà en consultation")) {
          throw new Error("⚠️ Ce médecin a déjà un patient en consultation.");
        } else {
          throw new Error(errorMessage);
        }
      }

      const data = await res.json();
      showSuccess(`Patient n°${data.called.ticket.number} appelé en consultation pour ${getDoctorDisplayName(selectedDoctorForCall)} ! 🎉`, 4000);
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
        const errorMessage = errorData.message || `Erreur ${res.status}`;
        
        // Messages d'erreur personnalisés pour une meilleure UX
        if (errorMessage.includes("déjà un ticket")) {
          throw new Error("⚠️ Un ticket est déjà en cours pour ce médecin. Veuillez attendre qu'il soit terminé ou contactez le patient.");
        } else if (errorMessage.includes("limite")) {
          throw new Error("⚠️ Limite de tickets atteinte pour aujourd'hui.");
        } else {
          throw new Error(errorMessage);
        }
      }

      const data = await res.json();
      showSuccess(`Ticket n°${data.number} créé pour ${getDoctorDisplayName(selectedDoctorForTicket)} ! 🎫`, 4000);
      fetchQueue();

    } catch (error) {
      console.error("Erreur création ticket:", error);
      showError(error.message || "Impossible de créer le ticket", 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetComplete = (result) => {
    showSuccess(result.message, 4000);
    fetchQueue();
  };

  const handleResetError = (error) => {
    showError(error, 5000);
  };

  if (!user) {
    return (
      <Layout>
        <AnimatedPage>
          <div className="loading-container">
            <div className="loading-content">
              <div className="loading-spinner animate-float">🏥</div>
              <p className="loading-text">Chargement du dashboard...</p>
            </div>
          </div>
        </AnimatedPage>
      </Layout>
    );
  }

  return (
    <Layout>
      <AnimatedPage>
        <div className="dashboard-wrapper">
          <div className="dashboard-container">
            
            {/* Header du dashboard amélioré */}
            <div className="dashboard-header">
              <div className="dashboard-header-content">
                <div>
                  <h1 className="dashboard-title">
                    🏥 Dashboard Secrétaire
                  </h1>
                  <p className="dashboard-subtitle">
                    ✨ Gestion centralisée des files d'attente et consultations médicales
                  </p>
                </div>
                <div className="dashboard-actions">
                  <button
                    onClick={() => navigate('/queue')}
                    className="btn-primary"
                  >
                    📋 File complète
                  </button>
                  <button
                    onClick={() => navigate('/admin')}
                    className="btn-secondary"
                  >
                    ⚙️ Administration
                  </button>
                  <button
                    onClick={() => navigate('/')}
                    className="btn-secondary"
                  >
                    🏠 Accueil
                  </button>
                </div>
              </div>
            </div>

            <Toast toasts={toasts} removeToast={removeToast} />

            {/* Sélecteur de médecin */}
            <div className="dashboard-section">
              <DoctorQueueSelector 
                selectedDoctor={selectedDoctor}
                onDoctorChange={setSelectedDoctor}
              />
            </div>

            {/* Statistiques en temps réel améliorées */}
            <div className="dashboard-card dashboard-section">
              <h2 className="dashboard-card-title">
                📊 Statistiques en temps réel
                <span className="animate-pulse ml-2">🔴</span>
              </h2>
              <div className="stats-grid">
                <div className="stats-card stats-card-blue">
                  <div className="stats-number">⏳ {stats.waitingCount}</div>
                  <div className="stats-label">Patients en attente</div>
                </div>
                <div className="stats-card stats-card-yellow">
                  <div className="stats-number">👨‍⚕️ {stats.inConsultationCount}</div>
                  <div className="stats-label">En consultation</div>
                </div>
                <div className="stats-card stats-card-green">
                  <div className="stats-number">✅ {stats.completedToday}</div>
                  <div className="stats-label">Consultations terminées</div>
                </div>
                <div className="stats-card stats-card-red">
                  <div className="stats-number">❌ {stats.cancelledToday}</div>
                  <div className="stats-label">Annulations du jour</div>
                </div>
                <div className="stats-card stats-card-purple">
                  <div className="stats-number">📈 {stats.totalToday}</div>
                  <div className="stats-label">Total journée</div>
                </div>
                <div className="stats-card stats-card-orange">
                  <div className="stats-number">⏱️ {stats.averageWaitTime}min</div>
                  <div className="stats-label">Temps d'attente moyen</div>
                </div>
              </div>
            </div>

            {/* Layout en 2 colonnes pour desktop */}
            <div className="dashboard-grid-2 dashboard-section">
              
              {/* Colonne gauche - Actions principales */}
              <div className="space-y-8">
                
                {/* Création de ticket améliorée */}
                <div className="dashboard-card">
                  <h3 className="dashboard-card-title">
                    🎫 Nouveau ticket patient
                  </h3>
                  <div className="space-y-6">
                    <div>
                      <label className="form-label">👨‍⚕️ Sélectionner le médecin</label>
                      <select
                        value={selectedDoctorForTicket}
                        onChange={(e) => setSelectedDoctorForTicket(e.target.value)}
                        className="form-select"
                      >
                        <option value="dr-husni-said-habibi">🩺 {getDoctorDisplayName('dr-husni-said-habibi')}</option>
                        <option value="dr-helios-blasco">🏥 {getDoctorDisplayName('dr-helios-blasco')}</option>
                        <option value="dr-jean-eric-panacciulli">⚕️ {getDoctorDisplayName('dr-jean-eric-panacciulli')}</option>
                      </select>
                    </div>
                    <button
                      onClick={handleCreateTicket}
                      disabled={isLoading}
                      className="btn-primary btn-full btn-large"
                    >
                      {isLoading ? "🔄 Création en cours..." : "🎫 Créer un nouveau ticket"}
                    </button>
                    <div className="text-xs text-gray-500 text-center">
                      💡 Un seul ticket actif par médecin à la fois
                    </div>
                  </div>
                </div>

                {/* Actions rapides améliorées */}
                <div className="dashboard-card">
                  <h3 className="dashboard-card-title">
                    ⚡ Actions rapides
                  </h3>
                  <div className="space-y-4">
                    <button
                      onClick={() => handleCallNext()}
                      disabled={isLoading}
                      className="btn-success btn-full btn-large"
                    >
                      {isLoading ? "🔄 Appel en cours..." : "📢 Appeler le patient suivant"}
                    </button>
                    
                    <ResetQueueButton
                      selectedDoctor={selectedDoctor}
                      onResetComplete={handleResetComplete}
                      onError={handleResetError}
                      className="btn-danger btn-full btn-large"
                    />
                  </div>
                </div>

              </div>

              {/* Colonne droite - État des médecins amélioré */}
              <div className="dashboard-card">
                <h3 className="dashboard-card-title">
                  👩‍⚕️ État des consultations en temps réel
                  <span className="animate-pulse ml-2">🔴</span>
                </h3>
                <div className="space-y-6">
                  {['dr-husni-said-habibi', 'dr-helios-blasco', 'dr-jean-eric-panacciulli'].map(doctorId => {
                    const doctorQueue = queue.filter(t => t.docteur === doctorId);
                    const inConsultation = doctorQueue.find(t => t.status === "en_consultation");
                    const waiting = doctorQueue.filter(t => t.status === "en_attente");
                    const nextPatient = waiting.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))[0];
                    
                    return (
                      <div key={doctorId} className="doctor-status-card">
                        <h4 className="doctor-status-title">
                          👨‍⚕️ {getDoctorDisplayName(doctorId)}
                        </h4>
                        
                        <div className="doctor-status-info">
                          {/* Patient en consultation */}
                          {inConsultation ? (
                            <div className="status-card status-card-consultation">
                              <div className="status-text">🩺 Consultation en cours</div>
                              <div className="status-detail">🎫 Ticket n°{inConsultation.number}</div>
                            </div>
                          ) : (
                            <div className="status-card status-card-available">
                              <div className="status-text">✅ Médecin disponible</div>
                            </div>
                          )}

                          {/* Patient suivant */}
                          {nextPatient ? (
                            <div className="status-card status-card-next">
                              <div className="status-text">⏳ Prochain patient</div>
                              <div className="status-detail">🎫 Ticket n°{nextPatient.number}</div>
                            </div>
                          ) : (
                            <div className="status-card status-card-empty">
                              <div className="status-text">🚫 File d'attente vide</div>
                            </div>
                          )}

                          {/* Nombre en attente */}
                          <div className="doctor-waiting-count">
                            <div className="doctor-waiting-number">{waiting.length}</div>
                            <div className="doctor-waiting-label">👥 patients en attente</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
            </div>

            {/* Actions par médecin améliorées */}
            <div className="dashboard-card dashboard-section">
              <h3 className="dashboard-card-title">
                📞 Appels spécifiques par médecin
              </h3>
              <div className="dashboard-grid-3">
                <button
                  onClick={() => handleCallNext('dr-husni-said-habibi')}
                  disabled={isLoading}
                  className="doctor-btn doctor-btn-orange"
                >
                  <div className="doctor-name">📞 Dr. Husni Said Habibi</div>
                  <div className="doctor-action">🩺 Appeler le patient suivant</div>
                </button>
                
                <button
                  onClick={() => handleCallNext('dr-helios-blasco')}
                  disabled={isLoading}
                  className="doctor-btn doctor-btn-teal"
                >
                  <div className="doctor-name">📞 Dr. Helios Blasco</div>
                  <div className="doctor-action">🏥 Appeler le patient suivant</div>
                </button>
                
                <button
                  onClick={() => handleCallNext('dr-jean-eric-panacciulli')}
                  disabled={isLoading}
                  className="doctor-btn doctor-btn-cyan"
                >
                  <div className="doctor-name">📞 Dr. Jean-Eric Panacciulli</div>
                  <div className="doctor-action">⚕️ Appeler le patient suivant</div>
                </button>
              </div>
            </div>

            {/* File détaillée si sélectionnée */}
            {selectedDoctor && (
              <div className="dashboard-card">
                <h3 className="dashboard-card-title">
                  📋 File d'attente de {getDoctorDisplayName(selectedDoctor)}
                  <span className="animate-pulse ml-2">🔴</span>
                </h3>
                {queue.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">🎯</div>
                    <p className="empty-text">Aucun patient dans cette file d'attente</p>
                    <p className="text-sm text-gray-400 mt-2">La consultation est libre ! 🎉</p>
                  </div>
                ) : (
                  <div className="dashboard-grid">
                    {queue.map((ticket, index) => (
                      <div key={ticket._id} className="ticket-card">
                        <div className="ticket-header">
                          <span className="ticket-number">🎫 #{ticket.number}</span>
                          <div className={`ticket-status ${
                            ticket.status === "en_consultation" ? "ticket-status-consultation" :
                            ticket.status === "en_attente" ? "ticket-status-waiting" :
                            ticket.status === "termine" ? "ticket-status-completed" :
                            "ticket-status-cancelled"
                          }`}>
                            {ticket.status === "en_attente" ? "⏳ En attente" :
                             ticket.status === "en_consultation" ? "🩺 En consultation" :
                             ticket.status === "termine" ? "✅ Terminé" : "❌ Annulé"}
                          </div>
                        </div>
                        
                        <div className="ticket-time">
                          🕐 {new Date(ticket.createdAt).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                        
                        {ticket.status === "en_attente" && (
                          <div className="ticket-position">
                            📍 Position {queue.filter(t => t.status === "en_attente").findIndex(t => t._id === ticket._id) + 1} dans la file
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Modales avec style professionnel amélioré */}
            <ConfirmModal
              isOpen={showCallModal}
              title="📢 Confirmation d'appel patient"
              message={
                <div className="modal-content-horizontal">
                  <div className="modal-icon">📞</div>
                  <div className="modal-text">
                    <p className="modal-title-text">
                      Voulez-vous appeler le patient suivant pour une consultation avec 
                      <span className="font-bold text-blue-600"> {getDoctorDisplayName(selectedDoctorForCall)}</span> ?
                    </p>
                    <p className="modal-subtitle-text">
                      🎫 Le patient sera automatiquement placé en consultation et retiré de la file d'attente.
                    </p>
                  </div>
                </div>
              }
              onConfirm={confirmCallNext}
              onCancel={() => {
                setShowCallModal(false);
                setSelectedDoctorForCall(null);
              }}
              confirmText="📢 Confirmer l'appel"
              cancelText="❌ Annuler"
              isLoading={isLoading}
            />

            <ConfirmModal
              isOpen={showCreateTicketModal}
              title="🎫 Confirmation de création de ticket"
              message={
                <div className="modal-content-horizontal">
                  <div className="modal-icon">🎫</div>
                  <div className="modal-text">
                    <p className="modal-title-text">
                      Voulez-vous créer un nouveau ticket de consultation pour 
                      <span className="font-bold text-blue-600"> {getDoctorDisplayName(selectedDoctorForTicket)}</span> ?
                    </p>
                    <p className="modal-subtitle-text">
                      📋 Le ticket sera automatiquement ajouté à la file d'attente du médecin sélectionné.
                    </p>
                  </div>
                </div>
              }
              onConfirm={confirmCreateTicket}
              onCancel={() => setShowCreateTicketModal(false)}
              confirmText="🎫 Créer le ticket"
              cancelText="❌ Annuler"
              isLoading={isLoading}
            />
          </div>
        </div>
      </AnimatedPage>
    </Layout>
  );
} 