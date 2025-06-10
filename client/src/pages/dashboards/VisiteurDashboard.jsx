import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import AnimatedPage from "../../components/AnimatedPage";
import Toast from "../../components/Toast";
import { useToast } from "../../hooks/useToast";
import BACKEND_URL from "../../config/api";

export default function VisiteurDashboard() {
  const [user, setUser] = useState(null);
  const [queue, setQueue] = useState([]);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [queueLoading, setQueueLoading] = useState(true);
  const navigate = useNavigate();
  const { toasts, showInfo, removeToast } = useToast();

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

    // Actualiser toutes les 3 secondes
    const interval = setInterval(() => {
      loadQueue();
      setCurrentTime(Date.now());
    }, 3000);

    return () => clearInterval(interval);
  }, [navigate]);

  const loadQueue = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/queue`);
      if (res.ok) {
        const data = await res.json();
        setQueue(data);
      }
    } catch (error) {
      console.error("Erreur chargement queue:", error);
    } finally {
      setQueueLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("isAuthenticated");
    showInfo("Déconnexion réussie");
    navigate("/");
  };

  // Estimation du temps d'attente
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

  const waitingCount = queue.filter(t => t.status === "en_attente").length;
  const inConsultationCount = queue.filter(t => t.status === "en_consultation").length;
  const totalToday = queue.length;
  const completedToday = queue.filter(t => t.status === "termine").length;

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
                <h1 className="dashboard-title text-purple-800">
                  👁️ Espace Visiteur
                </h1>
                <p className="dashboard-subtitle">
                  Bienvenue {user.fullName}
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

          {/* Statistiques générales modernes */}
          <div className="dashboard-card mb-6">
            <h2 className="dashboard-title text-gray-800 mb-4">
              📊 Statistiques en temps réel
            </h2>
            <div className="stats-grid">
              <div className="stats-card border-blue-200 accessible-shadow">
                <div className="stats-number text-blue-600">{waitingCount}</div>
                <div className="stats-label">En attente</div>
              </div>
              <div className="stats-card border-green-200 accessible-shadow">
                <div className="stats-number text-green-600">{inConsultationCount}</div>
                <div className="stats-label">En consultation</div>
              </div>
              <div className="stats-card border-gray-200 accessible-shadow">
                <div className="stats-number text-gray-600">{completedToday}</div>
                <div className="stats-label">Terminées</div>
              </div>
              <div className="stats-card border-yellow-200 accessible-shadow">
                <div className="stats-number text-yellow-600">{totalToday}</div>
                <div className="stats-label">Total du jour</div>
              </div>
            </div>
          </div>

          {/* Temps d'attente estimé */}
          {waitingCount > 0 && (
            <div className="alert-card bg-orange-50 border border-orange-200">
              <h3 className="text-responsive-lg font-semibold text-orange-800 mb-2">⏱️ Temps d'attente estimé</h3>
              <p className="text-responsive-base text-orange-700">
                Si vous preniez un ticket maintenant, vous seriez en position <strong>{waitingCount + 1}</strong> 
                {" "}avec une attente d'environ <strong>{getEstimatedTime(waitingCount + 1)}</strong>.
              </p>
            </div>
          )}

          {/* File d'attente en temps réel */}
          <div className="dashboard-card">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
              <h2 className="text-responsive-lg font-semibold text-gray-800">
                📋 File d'attente en temps réel
              </h2>
              <span className="text-responsive-sm text-gray-500">
                Mise à jour : {new Date(currentTime).toLocaleTimeString()}
              </span>
            </div>

            {queueLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin text-2xl mb-2">⏳</div>
                <p className="text-responsive-sm text-gray-500">Chargement de la file d'attente...</p>
              </div>
            ) : queue.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">🎯</div>
                <p className="text-responsive-base">Aucun patient dans la file d'attente</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {queue
                  .filter(t => t.status !== "desiste") // Masquer les tickets annulés
                  .map((ticket, index) => {
                    let statusInfo;
                    let bgColor;
                    
                    switch (ticket.status) {
                      case "en_consultation":
                        statusInfo = { text: "En consultation", color: "text-green-700", bg: "bg-green-100" };
                        bgColor = "bg-green-50 border-green-200";
                        break;
                      case "termine":
                        statusInfo = { text: "Terminé", color: "text-gray-700", bg: "bg-gray-100" };
                        bgColor = "bg-gray-50 border-gray-200";
                        break;
                      default: // en_attente
                        const position = queue.filter(t => t.status === "en_attente").findIndex(t => t._id === ticket._id) + 1;
                        statusInfo = { 
                          text: position ? `Position ${position}` : "En attente", 
                          color: "text-blue-700", 
                          bg: "bg-blue-100" 
                        };
                        bgColor = "bg-blue-50 border-blue-200";
                    }

                    return (
                      <div key={ticket._id} className={`ticket-card ${bgColor}`}>
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                          <div className="flex items-center gap-3">
                            <span className="text-responsive-base font-semibold text-gray-800">
                              🎫 Ticket n°{ticket.number}
                            </span>
                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.color}`}>
                              {statusInfo.text}
                            </div>
                          </div>
                          
                          <div className="flex flex-col sm:items-end gap-1">
                            {ticket.user && (
                              <div className="text-responsive-sm text-gray-600">
                                👤 {ticket.user.fullName}
                              </div>
                            )}
                            {ticket.docteur && (
                              <div className="text-responsive-sm text-gray-600">
                                👨‍⚕️ {ticket.docteur}
                              </div>
                            )}
                            <div className="text-responsive-sm text-gray-500">
                              ⏰ {new Date(ticket.createdAt).toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Actions rapides */}
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
                className="action-button action-button-primary text-left"
              >
                📋 File d'attente publique
              </button>
              <button
                onClick={loadQueue}
                className="action-button action-button-success text-left"
              >
                🔄 Actualiser
              </button>
            </div>
          </div>

          {/* Informations complémentaires */}
          <div className="dashboard-card">
            <h3 className="text-responsive-lg font-semibold text-gray-800 mb-3">📈 Analyse de la journée</h3>
            <div className="info-grid">
              <div className="stats-card border-purple-200">
                <div className="text-responsive-sm text-purple-600 font-medium">Taux d'occupation</div>
                <div className="text-responsive-lg font-bold text-purple-800">
                  {totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0}%
                </div>
              </div>
              <div className="stats-card border-indigo-200">
                <div className="text-responsive-sm text-indigo-600 font-medium">Temps moyen estimé</div>
                <div className="text-responsive-lg font-bold text-indigo-800">
                  {getEstimatedTime(1)}
                </div>
              </div>
            </div>
          </div>

          {/* Aide pour visiteurs */}
          <div className="help-text">
            <h4 className="text-responsive-base font-semibold mb-2">💡 Informations pour les visiteurs</h4>
            <p className="text-responsive-sm">
              Cet espace vous permet de consulter en temps réel l'état de la file d'attente. 
              Les données sont automatiquement mises à jour toutes les 3 secondes pour vous offrir 
              les informations les plus récentes.
            </p>
          </div>
        </div>
      </AnimatedPage>
    </Layout>
  );
} 