import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import AnimatedPage from "../../components/AnimatedPage";
import Toast from "../../components/Toast";
import ConfirmModal from "../../components/ConfirmModal";
import { useToast } from "../../hooks/useToast";
import BACKEND_URL from "../../config/api";
import { Stethoscope, Clock3, CheckCircle2, UsersRound, LogOut, Home as HomeIcon, RefreshCcw, Pause, Play, Phone, Ticket as TicketIcon, MapPin, Smile, Zap, X as XIcon, BarChart3 } from "lucide-react";
import { getDoctorDashboardRoute } from "../../utils/doctorMapping";

export default function MedecinDashboard() {
  const [user, setUser] = useState(null);
  const [queue, setQueue] = useState([]);
  const [currentPatient, setCurrentPatient] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [disponible, setDisponible] = useState(true);
  const [stats, setStats] = useState({});
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [consultationStartTime, setConsultationStartTime] = useState(null);
  const navigate = useNavigate();
  const { toasts, showSuccess, showError, showWarning, showInfo, removeToast } = useToast();

  // Mise à jour de l'heure en temps réel
  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timeInterval);
  }, []);

  // Surveillance de la connectivité
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showInfo("Connexion rétablie", 2000);
      fetchQueue();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      showWarning("Connexion perdue - Mode hors ligne", 0);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showInfo, showWarning]);

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

    // Actualiser plus fréquemment pour les médecins
    const interval = setInterval(() => {
      if (isOnline) {
        fetchQueue();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [navigate, isOnline]);

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
        setLastUpdate(new Date());
        
        // Trouver le patient en consultation
        const inConsultation = data.find(t => t.status === "en_consultation");
        
        // Si un nouveau patient commence, noter l'heure
        if (inConsultation && (!currentPatient || currentPatient._id !== inConsultation._id)) {
          setConsultationStartTime(new Date());
        } else if (!inConsultation) {
          setConsultationStartTime(null);
        }
        
        setCurrentPatient(inConsultation);

        // Calculer les statistiques avec les données fraîches
        const today = data.filter(t => {
          const ticketDate = new Date(t.createdAt);
          const todayDate = new Date();
          return ticketDate.toDateString() === todayDate.toDateString();
        });

        const completedToday = today.filter(t => t.status === "termine").length;
        const totalToday = today.length;
        const efficiency = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;
        const averageConsultationTime = completedToday > 0 ? Math.round(
          today.filter(t => t.status === "termine")
            .reduce((sum, t) => sum + (new Date(t.updatedAt) - new Date(t.createdAt)), 0) 
            / completedToday / (1000 * 60)
        ) : 0;

        setStats({
          waitingCount: data.filter(t => t.status === "en_attente").length,
          inConsultationCount: data.filter(t => t.status === "en_consultation").length,
          completedToday,
          cancelledToday: today.filter(t => t.status === "desiste").length,
          totalToday,
          efficiency,
          averageConsultationTime
        });
      }
    } catch (error) {
      if (isOnline) {
        console.error("Erreur chargement queue:", error);
      }
    }
  };

  const getWelcomeMessage = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Bonjour";
    if (hour < 18) return "Bon après-midi";
    return "Bonsoir";
  };

  const getDoctorName = () => {
    return user?.lastName || user?.firstName || user?.email?.split('@')[0] || 'Docteur';
  };

  const getConsultationDuration = () => {
    if (!consultationStartTime || !currentPatient) return null;
    const duration = Math.round((new Date() - consultationStartTime) / (1000 * 60));
    return duration;
  };

  const getActivityStatus = () => {
    if (!disponible) return { status: "En pause", color: "red", icon: <Pause className="w-4 h-4" /> };
    if (currentPatient) return { status: "En consultation", color: "yellow", icon: <Stethoscope className="w-4 h-4" /> };
    if (stats.waitingCount > 0) return { status: "Patients en attente", color: "blue", icon: <UsersRound className="w-4 h-4" /> };
    return { status: "Disponible", color: "green", icon: <CheckCircle2 className="w-4 h-4" /> };
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

    if (!disponible) {
      showWarning("Vous êtes en pause. Activez votre disponibilité pour appeler un patient.");
      return;
    }

    setShowCallModal(true);
  };

  const playNotificationSound = () => {
    try {
      const audio = new Audio("/notify.mp3");
      audio.play().catch(() => {});
    } catch (e) {
      // Son non disponible
    }
  };

  const confirmCallNext = async () => {
    setShowCallModal(false);
    setIsLoading(true);

    try {
      showInfo("Appel du patient suivant...");

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
        const errorMessage = errorData.message || `Erreur ${res.status}`;
        
        if (errorMessage.includes("aucun patient")) {
          throw new Error("ℹ️ Aucun patient en attente actuellement.");
        } else if (errorMessage.includes("déjà en consultation")) {
          throw new Error("⚠️ Un patient est déjà en consultation.");
        } else {
          throw new Error(errorMessage);
        }
      }

      const data = await res.json();
      playNotificationSound();
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
      setConsultationStartTime(null);
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
      const res = await fetch(`${BACKEND_URL}/reset`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      });

      if (!res.ok) {
        throw new Error(`Erreur ${res.status}`);
      }

      const data = await res.json();
      showSuccess(`${data.message} - ${data.deletedCount} ticket(s) supprimé(s)`, 5000);
      fetchQueue();

    } catch (error) {
      console.error("Erreur reset:", error);
      showError("Impossible de réinitialiser la file", 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const getEstimatedTime = (position) => {
    const avgConsultationTime = stats.averageConsultationTime || 15;
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
          <div className="loading-container">
            <div className="loading-content">
              <div className="loading-spinner animate-float" aria-hidden="true"></div>
              <p className="loading-text">Chargement du dashboard...</p>
            </div>
          </div>
        </AnimatedPage>
      </Layout>
    );
  }

  const nextPatient = queue
    .filter(t => t.status === "en_attente")
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))[0];
  
  const activity = getActivityStatus();
  const consultationDuration = getConsultationDuration();

  return (
    <Layout>
      <AnimatedPage>
        <div className="dashboard-wrapper">
          <div className="dashboard-container">
            
            {/* Header du dashboard médecin */}
            <div className="dashboard-header">
              <div className="dashboard-header-content">
                <div>
                  <h1 className="dashboard-title">
                    <span className="inline-flex items-center gap-2"><Stethoscope className="w-5 h-5" /> Interface Médecin</span>
                  </h1>
                  <p className="dashboard-subtitle">
                    {getWelcomeMessage()}, Dr. {getDoctorName()} ! Votre espace de consultation
                  </p>
                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Clock3 className="w-4 h-4" /> {currentTime.toLocaleTimeString('fr-FR')}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1">{activity.icon} Statut:</span> <span className={`font-medium text-${activity.color}-600`}>{activity.status}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isOnline ? "En ligne" : "Hors ligne"}
                    </div>
                    <div className="text-xs">
                      Dernière MAJ: {lastUpdate.toLocaleTimeString('fr-FR')}
                    </div>
                  </div>
                </div>
                <div className="dashboard-actions">
                  <button
                    onClick={() => setDisponible(!disponible)}
                    className={`${disponible ? 'btn-success' : 'btn-warning'} transition-all duration-300`}
                  >
                    {disponible ? <span className="inline-flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Disponible</span> : <span className="inline-flex items-center gap-1"><Pause className="w-4 h-4" /> En pause</span>}
                  </button>
                  <button
                    onClick={() => navigate('/')}
                    className="btn-secondary"
                  >
                    <span className="inline-flex items-center gap-1"><HomeIcon className="w-4 h-4" /> Accueil</span>
                  </button>
                </div>
              </div>
            </div>

            <Toast toasts={toasts} removeToast={removeToast} />

            {/* Consultation actuelle */}
            {currentPatient && (
              <div className="dashboard-card dashboard-section">
                <h2 className="dashboard-card-title">
                  <span className="inline-flex items-center gap-2"><Stethoscope className="w-5 h-5" /> Consultation en cours</span>
                  {consultationDuration && (
                    <span className="text-sm font-normal text-gray-600 ml-2">
                      (Durée: {consultationDuration}min)
                    </span>
                  )}
                </h2>
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-500 rounded-lg p-6">
                  <div className="dashboard-grid mb-6">
                    <div className="text-center">
                      <p className="text-sm text-blue-600 font-medium">Patient</p>
                      <p className="text-xl font-bold text-blue-800">
                        {currentPatient.nom || 'Patient'} {currentPatient.prenom || ''}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-blue-600 font-medium">Ticket</p>
                      <p className="text-xl font-bold text-blue-800">
                        <span className="inline-flex items-center gap-1"><TicketIcon className="w-4 h-4" /> #{currentPatient.number}</span>
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-blue-600 font-medium">Heure d'arrivée</p>
                      <p className="text-xl font-bold text-blue-800">
                        <span className="inline-flex items-center gap-1"><Clock3 className="w-4 h-4" /> {new Date(currentPatient.createdAt).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</span>
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-blue-600 font-medium">Temps d'attente</p>
                      <p className="text-xl font-bold text-blue-800">
                        <span className="inline-flex items-center gap-1"><Clock3 className="w-4 h-4" /> {Math.round((new Date() - new Date(currentPatient.createdAt)) / (1000 * 60))}min</span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="dashboard-grid-3">
                    <button
                      onClick={handleFinishConsultation}
                      disabled={isLoading || !isOnline}
                      className="btn-success btn-large"
                    >
                      {isLoading ? <span className="inline-flex items-center gap-1"><RefreshCcw className="w-4 h-4" /> Finalisation...</span> : <span className="inline-flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Terminer la consultation</span>}
                    </button>
                    <button
                      onClick={() => fetchQueue()}
                      disabled={isLoading || !isOnline}
                      className="btn-secondary"
                    >
                      <span className="inline-flex items-center gap-1"><RefreshCcw className="w-4 h-4" /> Actualiser</span>
                    </button>
                    <button
                      onClick={() => setDisponible(false)}
                      className="btn-warning"
                    >
                      <span className="inline-flex items-center gap-1"><Pause className="w-4 h-4" /> Mettre en pause</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Prochain patient */}
            {nextPatient && !currentPatient && (
              <div className="dashboard-card dashboard-section">
                <h2 className="dashboard-card-title">
                  Prochain patient en attente
                </h2>
                <div className="bg-gradient-to-r from-green-50 to-green-100 border-l-4 border-green-500 rounded-lg p-6">
                  <div className="dashboard-grid mb-6">
                    <div className="text-center">
                      <p className="text-sm text-green-600 font-medium">Patient</p>
                      <p className="text-xl font-bold text-green-800">
                        {nextPatient.nom || 'Patient anonyme'} {nextPatient.prenom || ''}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-green-600 font-medium">Ticket</p>
                      <p className="text-xl font-bold text-green-800">
                        <span className="inline-flex items-center gap-1"><TicketIcon className="w-4 h-4" /> #{nextPatient.number}</span>
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-green-600 font-medium">Position</p>
                      <p className="text-xl font-bold text-green-800">
                        1ère position
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-green-600 font-medium">Temps d'attente</p>
                      <p className="text-xl font-bold text-green-800">
                        <span className="inline-flex items-center gap-1"><Clock3 className="w-4 h-4" /> {Math.round((new Date() - new Date(nextPatient.createdAt)) / (1000 * 60))}min</span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="dashboard-grid-2">
                    <button
                      onClick={handleCallNext}
                      disabled={isLoading || !isOnline || !disponible}
                      className="btn-primary btn-large"
                    >
                      {isLoading ? <span className="inline-flex items-center gap-1"><RefreshCcw className="w-4 h-4" /> Appel en cours...</span> : 
                       !disponible ? <span className="inline-flex items-center gap-1"><Pause className="w-4 h-4" /> En pause</span> :
                       <span className="inline-flex items-center gap-1"><Phone className="w-4 h-4" /> Appeler ce patient</span>}
                    </button>
                    <button
                      onClick={() => fetchQueue()}
                      disabled={isLoading || !isOnline}
                      className="btn-secondary"
                    >
                      <span className="inline-flex items-center gap-1"><RefreshCcw className="w-4 h-4" /> Actualiser la file</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* État quand aucun patient */}
            {!currentPatient && !nextPatient && (
              <div className="dashboard-card dashboard-section">
                <div className="empty-state">
                  <div className="empty-icon"><Smile className="w-8 h-8 text-gray-400" /></div>
                  <p className="empty-text">Aucun patient en attente</p>
                  <p className="text-sm text-gray-400 mt-2">
                    {disponible ? "Vous êtes disponible pour recevoir des patients" : "Vous êtes en pause"}
                  </p>
                  <button
                    onClick={() => fetchQueue()}
                    disabled={isLoading || !isOnline}
                    className="btn-secondary mt-4"
                  >
                    <span className="inline-flex items-center gap-1"><RefreshCcw className="w-4 h-4" /> Vérifier les nouveaux patients</span>
                  </button>
                </div>
              </div>
            )}

            {/* Statistiques du médecin */}
            <div className="dashboard-card dashboard-section">
              <h2 className="dashboard-card-title">
                <span className="inline-flex items-center gap-2"><BarChart3 className="w-5 h-5" /> Mes statistiques du jour</span>
              </h2>
              <div className="stats-grid">
                <div className="stats-card stats-card-blue">
                    <div className="stats-number"><UsersRound className="w-4 h-4 inline mr-1" /> {stats.waitingCount || 0}</div>
                  <div className="stats-label">Patients en attente</div>
                </div>
                <div className="stats-card stats-card-green">
                    <div className="stats-number"><CheckCircle2 className="w-4 h-4 inline mr-1" /> {stats.completedToday || 0}</div>
                  <div className="stats-label">Consultations terminées</div>
                </div>
                <div className="stats-card stats-card-purple">
                    <div className="stats-number"><BarChart3 className="w-4 h-4 inline mr-1" /> {stats.totalToday || 0}</div>
                  <div className="stats-label">Total du jour</div>
                </div>
                <div className="stats-card stats-card-orange">
                    <div className="stats-number"><Zap className="w-4 h-4 inline mr-1" /> {stats.efficiency || 0}%</div>
                  <div className="stats-label">Taux d'efficacité</div>
                </div>
                <div className="stats-card stats-card-yellow">
                    <div className="stats-number"><Clock3 className="w-4 h-4 inline mr-1" /> {stats.averageConsultationTime || 0}min</div>
                  <div className="stats-label">Durée moyenne</div>
                </div>
                <div className="stats-card stats-card-red">
                    <div className="stats-number"><XIcon className="w-4 h-4 inline mr-1" /> {stats.cancelledToday || 0}</div>
                  <div className="stats-label">Annulations</div>
                </div>
              </div>
            </div>

            {/* File d'attente complète */}
            {queue.length > 0 && (
              <div className="dashboard-card dashboard-section">
                <h2 className="dashboard-card-title">
                  File d'attente complète
                  <span className="text-sm font-normal text-gray-600 ml-2">
                    ({queue.filter(t => t.status === "en_attente").length} patients en attente)
                  </span>
                </h2>
                <div className="dashboard-grid">
                  {queue.filter(t => t.status === "en_attente").map((ticket, index) => {
                    const waitTime = Math.round((new Date() - new Date(ticket.createdAt)) / (1000 * 60));
                    const estimatedTime = getEstimatedTime(index + 1);
                    
                    return (
                      <div key={ticket._id} className="ticket-card">
                        <div className="ticket-header">
                          <span className="ticket-number"><TicketIcon className="w-4 h-4 inline mr-1" /> #{ticket.number}</span>
                          <div className="ticket-status ticket-status-waiting">
                            <span className="inline-flex items-center gap-1"><MapPin className="w-4 h-4" /> Position {index + 1}</span>
                          </div>
                        </div>
                        
                        <div className="space-y-2 mt-3">
                          <div className="text-sm font-medium text-gray-800">
                            {ticket.nom || 'Patient anonyme'} {ticket.prenom || ''}
                          </div>
                          <div className="ticket-time">
                            <span className="inline-flex items-center gap-1"><Clock3 className="w-4 h-4" /> Arrivée: {new Date(ticket.createdAt).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}</span>
                          </div>
                          <div className="text-sm text-gray-600">
                            <span className="inline-flex items-center gap-1"><Clock3 className="w-4 h-4" /> Temps d'attente: {waitTime}min</span>
                          </div>
                          <div className="text-xs text-blue-600">
                            Temps estimé: {estimatedTime}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Actions sur la file */}
                <div className="mt-6 flex gap-4 justify-center">
                  <button
                    onClick={handleResetQueue}
                    disabled={isLoading || !isOnline}
                    className="btn-danger"
                  >
                    Réinitialiser la file
                  </button>
                  <button
                    onClick={() => fetchQueue()}
                    disabled={isLoading || !isOnline}
                    className="btn-secondary"
                  >
                    <span className="inline-flex items-center gap-1"><RefreshCcw className="w-4 h-4" /> Actualiser</span>
                  </button>
                </div>
              </div>
            )}

            {/* Modales */}
            <ConfirmModal
              isOpen={showCallModal}
                title="Confirmation d'appel patient"
              message={
                <div className="modal-content-horizontal">
                  <div className="modal-icon"><Phone className="w-5 h-5" /></div>
                  <div className="modal-text">
                    <p className="modal-title-text">
                      Voulez-vous appeler le patient suivant en consultation ?
                    </p>
                    <p className="modal-subtitle-text">
                        Le patient sera automatiquement placé en consultation avec vous.
                    </p>
                  </div>
                </div>
              }
              onConfirm={confirmCallNext}
              onCancel={() => setShowCallModal(false)}
                confirmText="Confirmer l'appel"
                cancelText="Annuler"
              isLoading={isLoading}
            />

            <ConfirmModal
              isOpen={showFinishModal}
                title="Terminer la consultation"
              message={
                <div className="modal-content-horizontal">
                  <div className="modal-icon"><CheckCircle2 className="w-5 h-5" /></div>
                  <div className="modal-text">
                    <p className="modal-title-text">
                      Voulez-vous terminer la consultation du patient n°{currentPatient?.number} ?
                    </p>
                    <p className="modal-subtitle-text">
                        La consultation sera marquée comme terminée et le patient quittera la file.
                    </p>
                  </div>
                </div>
              }
              onConfirm={confirmFinishConsultation}
              onCancel={() => setShowFinishModal(false)}
                confirmText="Terminer"
                cancelText="Annuler"
              isLoading={isLoading}
            />

            <ConfirmModal
              isOpen={showResetModal}
                title="Réinitialiser la file d'attente"
              message={
                <div className="modal-content-horizontal">
                  <div className="modal-icon"><XIcon className="w-5 h-5" /></div>
                  <div className="modal-text">
                    <p className="modal-title-text">
                      Voulez-vous vraiment supprimer tous les patients en attente ?
                    </p>
                    <p className="modal-subtitle-text">
                        Cette action est irréversible et supprimera tous les tickets en attente.
                    </p>
                  </div>
                </div>
              }
              onConfirm={confirmResetQueue}
              onCancel={() => setShowResetModal(false)}
                confirmText="Confirmer la suppression"
                cancelText="Annuler"
              isLoading={isLoading}
            />
          </div>
        </div>
      </AnimatedPage>
    </Layout>
  );
} 