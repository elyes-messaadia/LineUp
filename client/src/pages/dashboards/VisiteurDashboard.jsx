import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import AnimatedPage from "../../components/AnimatedPage";
import Toast from "../../components/Toast";
import { useToast } from "../../hooks/useToast";
import BACKEND_URL from "../../config/api";
import { getDoctorDisplayName } from "../../config/doctors";

export default function VisiteurDashboard() {
  const [user, setUser] = useState(null);
  const [queue, setQueue] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [queueLoading, setQueueLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [stats, setStats] = useState({});
  const navigate = useNavigate();
  const { toasts, showInfo, showWarning, removeToast } = useToast();

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
      showInfo("🌐 Connexion rétablie", 2000);
      loadQueue();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      showWarning("⚠️ Connexion perdue - Affichage des dernières données", 0);
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
    if (parsedUser.role.name !== "visiteur") {
      navigate("/login");
      return;
    }

    setUser(parsedUser);
    loadQueue();

    // Actualiser régulièrement
    const interval = setInterval(() => {
      if (isOnline) {
        loadQueue();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [navigate, isOnline]);

  const loadQueue = async () => {
    try {
      let url = `${BACKEND_URL}/queue`;
      if (selectedDoctor) {
        url += `?docteur=${selectedDoctor}`;
      }
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setQueue(data);
        setLastUpdate(new Date());
        calculateStats(data);
      }
    } catch (error) {
      if (isOnline) {
        console.error("Erreur chargement queue:", error);
      }
    } finally {
      setQueueLoading(false);
    }
  };

  const calculateStats = (queueData) => {
    const today = queueData.filter(t => {
      const ticketDate = new Date(t.createdAt);
      const todayDate = new Date();
      return ticketDate.toDateString() === todayDate.toDateString();
    });

    const waitingCount = queueData.filter(t => t.status === "en_attente").length;
    const inConsultationCount = queueData.filter(t => t.status === "en_consultation").length;
    const completedToday = today.filter(t => t.status === "termine").length;
    const totalToday = today.length;
    const efficiency = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;
    
    // Calcul du temps d'attente moyen
    const averageWaitTime = waitingCount > 0 ? Math.round(waitingCount * 15) : 0;

    setStats({
      waitingCount,
      inConsultationCount,
      completedToday,
      totalToday,
      efficiency,
      averageWaitTime,
      cancelledToday: today.filter(t => t.status === "desiste").length
    });
  };

  const getEstimatedTime = (position) => {
    const avgConsultationTime = 15;
    const totalMinutes = position * avgConsultationTime;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours > 0) {
      return `${hours}h${minutes.toString().padStart(2, '0')}`;
    }
    return `${minutes} min`;
  };

  const getWelcomeMessage = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "🌅 Bonjour";
    if (hour < 18) return "☀️ Bon après-midi";
    return "🌙 Bonsoir";
  };

  const getActivityLevel = () => {
    const totalWaiting = stats.waitingCount || 0;
    if (totalWaiting === 0) return { level: "Calme", color: "green", icon: "😌" };
    if (totalWaiting <= 5) return { level: "Normal", color: "blue", icon: "😊" };
    if (totalWaiting <= 10) return { level: "Actif", color: "yellow", icon: "😐" };
    return { level: "Très occupé", color: "red", icon: "😰" };
  };

  if (!user) {
    return (
      <Layout>
        <AnimatedPage>
          <div className="loading-container">
            <div className="loading-content">
              <div className="loading-spinner animate-float">👁️</div>
              <p className="loading-text">Chargement de la vue visiteur...</p>
            </div>
          </div>
        </AnimatedPage>
      </Layout>
    );
  }

  const activity = getActivityLevel();
  const waitingPatients = queue.filter(t => t.status === "en_attente");

  return (
    <Layout>
      <AnimatedPage>
        <div className="dashboard-wrapper">
          <div className="dashboard-container">
            
            {/* Header du dashboard visiteur */}
            <div className="dashboard-header">
              <div className="dashboard-header-content">
                <div>
                  <h1 className="dashboard-title">
                    👁️ Vue Visiteur
                  </h1>
                  <p className="dashboard-subtitle">
                    {getWelcomeMessage()} ! ✨ Consultez la file d'attente en temps réel
                  </p>
                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      🕐 {currentTime.toLocaleTimeString('fr-FR')}
                    </div>
                    <div className="flex items-center gap-2">
                      {activity.icon} Activité: <span className={`font-medium text-${activity.color}-600`}>{activity.level}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isOnline ? "🟢 En ligne" : "🔴 Hors ligne"}
                    </div>
                    <div className="text-xs">
                      ↻ Dernière MAJ: {lastUpdate.toLocaleTimeString('fr-FR')}
                    </div>
                  </div>
                </div>
                <div className="dashboard-actions">
                  <button
                    onClick={() => loadQueue()}
                    disabled={queueLoading || !isOnline}
                    className="btn-primary"
                  >
                    {queueLoading ? "🔄 Actualisation..." : "🔄 Actualiser"}
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
            <div className="dashboard-card dashboard-section">
              <h3 className="dashboard-card-title">
                🔍 Filtrer par médecin
              </h3>
              <div className="space-y-4">
                <select
                  value={selectedDoctor || ''}
                  onChange={(e) => setSelectedDoctor(e.target.value || null)}
                  className="form-select"
                >
                  <option value="">👨‍⚕️ Tous les médecins</option>
                  <option value="dr-husni-said-habibi">🩺 {getDoctorDisplayName('dr-husni-said-habibi')}</option>
                  <option value="dr-helios-blasco">🏥 {getDoctorDisplayName('dr-helios-blasco')}</option>
                  <option value="dr-jean-eric-panacciulli">⚕️ {getDoctorDisplayName('dr-jean-eric-panacciulli')}</option>
                </select>
                {selectedDoctor && (
                  <div className="text-sm text-blue-600">
                    📊 Affichage de la file pour {getDoctorDisplayName(selectedDoctor)}
                  </div>
                )}
              </div>
            </div>

            {/* Statistiques en temps réel */}
            <div className="dashboard-card dashboard-section">
              <h2 className="dashboard-card-title">
                📊 Situation actuelle
                <span className="animate-pulse ml-2">🔴</span>
              </h2>
              <div className="stats-grid">
                <div className="stats-card stats-card-blue">
                  <div className="stats-number">👥 {stats.waitingCount || 0}</div>
                  <div className="stats-label">Patients en attente</div>
                </div>
                <div className="stats-card stats-card-yellow">
                  <div className="stats-number">🩺 {stats.inConsultationCount || 0}</div>
                  <div className="stats-label">En consultation</div>
                </div>
                <div className="stats-card stats-card-green">
                  <div className="stats-number">✅ {stats.completedToday || 0}</div>
                  <div className="stats-label">Terminées aujourd'hui</div>
                </div>
                <div className="stats-card stats-card-purple">
                  <div className="stats-number">📈 {stats.totalToday || 0}</div>
                  <div className="stats-label">Total du jour</div>
                </div>
                <div className="stats-card stats-card-orange">
                  <div className="stats-number">⏱️ {stats.averageWaitTime || 0}min</div>
                  <div className="stats-label">Temps d'attente estimé</div>
                </div>
                <div className="stats-card stats-card-cyan">
                  <div className="stats-number">⚡ {stats.efficiency || 0}%</div>
                  <div className="stats-label">Efficacité</div>
                </div>
              </div>
            </div>

            {/* État par médecin */}
            <div className="dashboard-card dashboard-section">
              <h2 className="dashboard-card-title">
                👨‍⚕️ État des consultations par médecin
                <span className="animate-pulse ml-2">🔴</span>
              </h2>
              <div className="dashboard-grid-3">
                {['dr-husni-said-habibi', 'dr-helios-blasco', 'dr-jean-eric-panacciulli'].map(doctorId => {
                  const doctorQueue = queue.filter(t => t.docteur === doctorId);
                  const inConsultation = doctorQueue.find(t => t.status === "en_consultation");
                  const waiting = doctorQueue.filter(t => t.status === "en_attente");
                  const nextPatient = waiting.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))[0];
                  const estimatedWaitTime = waiting.length * 15;

                  return (
                    <div key={doctorId} className="doctor-status-card">
                      <h4 className="doctor-status-title">
                        {getDoctorDisplayName(doctorId)}
                      </h4>
                      
                      <div className="doctor-status-info">
                        {/* État actuel */}
                        {inConsultation ? (
                          <div className="status-card status-card-consultation">
                            <div className="status-text">🩺 En consultation</div>
                            <div className="status-detail">
                              Ticket n°{inConsultation.number}
                            </div>
                          </div>
                        ) : (
                          <div className="status-card status-card-available">
                            <div className="status-text">✅ Disponible</div>
                          </div>
                        )}

                        {/* Prochain patient */}
                        {nextPatient ? (
                          <div className="status-card status-card-next">
                            <div className="status-text">⏳ Prochain</div>
                            <div className="status-detail">
                              Ticket n°{nextPatient.number}
                            </div>
                          </div>
                        ) : (
                          <div className="status-card status-card-empty">
                            <div className="status-text">🚫 File vide</div>
                          </div>
                        )}

                        {/* Informations */}
                        <div className="grid grid-cols-2 gap-2 mt-3">
                          <div className="doctor-waiting-count">
                            <div className="doctor-waiting-number">{waiting.length}</div>
                            <div className="doctor-waiting-label">👥 en attente</div>
                          </div>
                          <div className="doctor-waiting-count">
                            <div className="doctor-waiting-number">{estimatedWaitTime}min</div>
                            <div className="doctor-waiting-label">⏱️ temps estimé</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* File d'attente détaillée */}
            <div className="dashboard-card dashboard-section">
              <h2 className="dashboard-card-title">
                📋 File d'attente détaillée
                {selectedDoctor && (
                  <span className="text-sm font-normal text-gray-600 ml-2">
                    - {getDoctorDisplayName(selectedDoctor)}
                  </span>
                )}
              </h2>
              
              {queueLoading ? (
                <div className="empty-state">
                  <div className="empty-icon animate-spin">⏳</div>
                  <p className="empty-text">Chargement des données...</p>
                </div>
              ) : waitingPatients.length > 0 ? (
                <div className="dashboard-grid">
                  {waitingPatients.map((ticket, index) => {
                    const waitTime = Math.round((new Date() - new Date(ticket.createdAt)) / (1000 * 60));
                    const estimatedTime = getEstimatedTime(index + 1);
                    
                    return (
                      <div key={ticket._id} className="ticket-card">
                        <div className="ticket-header">
                          <span className="ticket-number">🎫 #{ticket.number}</span>
                          <div className="ticket-status ticket-status-waiting">
                            📍 Position {index + 1}
                          </div>
                        </div>
                        
                        <div className="space-y-2 mt-3">
                          <div className="text-sm font-medium text-gray-800">
                            👨‍⚕️ {getDoctorDisplayName(ticket.docteur)}
                          </div>
                          <div className="ticket-time">
                            🕐 Arrivée: {new Date(ticket.createdAt).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                          <div className="text-sm text-gray-600">
                            ⏱️ Temps d'attente: {waitTime}min
                          </div>
                          <div className="text-xs text-blue-600">
                            ⏳ Temps estimé: {estimatedTime}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">😌</div>
                  <p className="empty-text">
                    {selectedDoctor 
                      ? `Aucun patient en attente pour ${getDoctorDisplayName(selectedDoctor)}`
                      : "Aucun patient en attente actuellement"
                    }
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    {selectedDoctor 
                      ? "Ce médecin est disponible ! 🟢"
                      : "Tous les médecins sont disponibles ! 🎉"
                    }
                  </p>
                </div>
              )}
            </div>

            {/* Informations utiles */}
            <div className="dashboard-card dashboard-section">
              <h2 className="dashboard-card-title">
                💡 Informations utiles
              </h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="text-blue-600 text-xl">🔄</div>
                    <div>
                      <h4 className="font-medium text-blue-800">Actualisation automatique</h4>
                      <p className="text-sm text-blue-600">Les données se mettent à jour automatiquement toutes les 5 secondes</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="text-blue-600 text-xl">⏱️</div>
                    <div>
                      <h4 className="font-medium text-blue-800">Temps d'attente</h4>
                      <p className="text-sm text-blue-600">Les temps sont estimatifs et basés sur une moyenne de 15min par consultation</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="text-blue-600 text-xl">🎫</div>
                    <div>
                      <h4 className="font-medium text-blue-800">Prendre un ticket</h4>
                      <p className="text-sm text-blue-600">Pour prendre un ticket, connectez-vous en tant que patient</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="text-blue-600 text-xl">📍</div>
                    <div>
                      <h4 className="font-medium text-blue-800">Positions</h4>
                      <p className="text-sm text-blue-600">Les positions peuvent changer selon les priorités médicales</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Actions rapides */}
            <div className="dashboard-card dashboard-section">
              <h2 className="dashboard-card-title">
                ⚡ Actions rapides
              </h2>
              <div className="dashboard-grid-3">
                <button
                  onClick={() => loadQueue()}
                  disabled={queueLoading || !isOnline}
                  className="btn-primary btn-large"
                >
                  {queueLoading ? "🔄 Actualisation..." : "🔄 Actualiser maintenant"}
                </button>
                
                <button
                  onClick={() => navigate('/login')}
                  className="btn-success btn-large"
                >
                  🎫 Prendre un ticket
                </button>
                
                <button
                  onClick={() => navigate('/')}
                  className="btn-secondary btn-large"
                >
                  🏠 Retour accueil
                </button>
              </div>
            </div>

            {/* Statut de connexion */}
            {!isOnline && (
              <div className="dashboard-card dashboard-section">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="text-yellow-600 text-xl">⚠️</div>
                    <div>
                      <h4 className="font-medium text-yellow-800">Mode hors ligne</h4>
                      <p className="text-sm text-yellow-600">Vous visualisez les dernières données disponibles. La connexion sera rétablie automatiquement.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </AnimatedPage>
    </Layout>
  );
} 