import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import AnimatedPage from "../../components/AnimatedPage";
import Toast from "../../components/Toast";
import ConfirmModal from "../../components/ConfirmModal";
import DashboardHeader from "../../components/DashboardHeader";
import { useToast } from "../../hooks/useToast";
import BACKEND_URL from "../../config/api";

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
    fetchQueue();

    // Actualiser toutes les secondes
    const interval = setInterval(() => {
      fetchQueue();
    }, 1000);

    return () => clearInterval(interval);
  }, [navigate]);

  const fetchQueue = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/queue`);
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

      const res = await fetch(`${BACKEND_URL}/next`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      });

      if (!res.ok) {
        throw new Error(`Erreur ${res.status}`);
      }

      const data = await res.json();
      playNotificationSound(); // Jouer le son quand on appelle un patient
      showSuccess(`Patient n°${data.called.number} appelé en consultation !`, 4000);
      fetchQueue();

    } catch (error) {
      console.error("Erreur appel patient:", error);
      showError("Impossible d'appeler le patient suivant", 5000);
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
    if (queue.length === 0) {
      showInfo("La file d'attente est déjà vide");
      return;
    }
    setShowResetModal(true);
  };

  const confirmResetQueue = async () => {
    setShowResetModal(false);
    setIsLoading(true);

    try {
      showWarning("Réinitialisation de la file d'attente...");

      const res = await fetch(`${BACKEND_URL}/reset`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      });

      if (!res.ok) {
        throw new Error(`Erreur ${res.status}`);
      }

      showSuccess("File d'attente réinitialisée avec succès !", 4000);
      setCurrentPatient(null);
      fetchQueue();

    } catch (error) {
      console.error("Erreur reset:", error);
      showError("Impossible de réinitialiser la file d'attente", 5000);
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* En-tête médecin unifié */}
          <DashboardHeader
            title="Espace Médecin"
            subtitle="Bienvenue Dr. {user}"
            icon="🩺"
            user={user}
            onLogout={handleLogout}
            colorScheme="green"
          />

          {/* Patient en consultation - Section principale */}
          {currentPatient ? (
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="bg-blue-500 text-white rounded-full p-3">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-blue-900 mb-1">
                      🩺 Patient en consultation
                    </h2>
                    <div className="flex items-center space-x-4 text-blue-700">
                      <span className="text-lg font-semibold">Ticket n°{currentPatient.number}</span>
                      <span className="text-sm bg-blue-200 px-2 py-1 rounded-full">
                        Depuis {new Date(currentPatient.updatedAt).toLocaleTimeString()}
                      </span>
                    </div>
                    {currentPatient.docteur && (
                      <p className="text-sm text-blue-600 mt-1">
                        Médecin : {currentPatient.docteur}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleFinishConsultation}
                  disabled={isLoading}
                  className="
                    bg-green-600 hover:bg-green-700 text-white 
                    px-6 py-3 rounded-lg font-medium transition-all
                    disabled:bg-gray-400 disabled:cursor-not-allowed
                    flex items-center space-x-2 shadow-md hover:shadow-lg
                  "
                >
                  <span>✅</span>
                  <span>Terminer la consultation</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-6 text-center">
              <div className="max-w-md mx-auto">
                <div className="text-4xl mb-3">⏱️</div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                  Aucun patient en consultation
                </h2>
                <p className="text-gray-600 mb-4">
                  Appelez le patient suivant pour commencer une consultation
                </p>
                <button
                  onClick={handleCallNext}
                  disabled={isLoading || queue.filter(t => t.status === "en_attente").length === 0}
                  className="
                    bg-blue-600 hover:bg-blue-700 text-white 
                    px-6 py-3 rounded-lg font-medium transition-all
                    disabled:bg-gray-400 disabled:cursor-not-allowed
                    flex items-center space-x-2 mx-auto shadow-md hover:shadow-lg
                  "
                >
                  <span>📢</span>
                  <span>Appeler le patient suivant</span>
                </button>
              </div>
            </div>
          )}

          {/* Statistiques du jour - Grid amélioré */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-shadow">
              <div className="text-3xl font-bold text-blue-600 mb-2">{stats.waitingCount}</div>
              <div className="text-sm font-medium text-blue-800">Patients en attente</div>
              <div className="text-xs text-blue-600 mt-1">File d'attente actuelle</div>
            </div>
            
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-shadow">
              <div className="text-3xl font-bold text-yellow-600 mb-2">{stats.inConsultationCount}</div>
              <div className="text-sm font-medium text-yellow-800">En consultation</div>
              <div className="text-xs text-yellow-600 mt-1">Actuellement en cours</div>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-shadow">
              <div className="text-3xl font-bold text-green-600 mb-2">{stats.completedToday}</div>
              <div className="text-sm font-medium text-green-800">Consultations terminées</div>
              <div className="text-xs text-green-600 mt-1">Aujourd'hui</div>
            </div>
            
            <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-shadow">
              <div className="text-3xl font-bold text-red-600 mb-2">{stats.cancelledToday}</div>
              <div className="text-sm font-medium text-red-800">Annulations</div>
              <div className="text-xs text-red-600 mt-1">Désistements du jour</div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-shadow">
              <div className="text-3xl font-bold text-purple-600 mb-2">{stats.totalToday}</div>
              <div className="text-sm font-medium text-purple-800">Total journée</div>
              <div className="text-xs text-purple-600 mt-1">Tous tickets créés</div>
            </div>
          </div>

          {/* Actions principales - Layout amélioré */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button
              onClick={handleCallNext}
              disabled={isLoading || currentPatient || queue.filter(t => t.status === "en_attente").length === 0}
              className={`
                p-6 rounded-xl font-medium text-center transition-all shadow-md hover:shadow-lg
                ${currentPatient || queue.filter(t => t.status === "en_attente").length === 0
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                  : "bg-blue-600 hover:bg-blue-700 text-white border border-blue-500"
                }
              `}
            >
              <div className="text-2xl mb-2">📢</div>
              <div className="font-semibold">Appeler le patient suivant</div>
              <div className="text-xs mt-1 opacity-75">
                {currentPatient ? "Terminez d'abord la consultation" : 
                 queue.filter(t => t.status === "en_attente").length === 0 ? "Aucun patient en attente" : 
                 "Faire entrer le prochain patient"}
              </div>
            </button>

            <button
              onClick={() => navigate("/queue")}
              className="
                p-6 bg-green-600 hover:bg-green-700 text-white rounded-xl 
                font-medium text-center transition-all shadow-md hover:shadow-lg
                border border-green-500
              "
            >
              <div className="text-2xl mb-2">📋</div>
              <div className="font-semibold">Voir la file complète</div>
              <div className="text-xs mt-1 opacity-75">Affichage temps réel</div>
            </button>

            <button
              onClick={handleResetQueue}
              disabled={isLoading}
              className="
                p-6 bg-red-600 hover:bg-red-700 text-white rounded-xl 
                font-medium text-center transition-all shadow-md hover:shadow-lg
                disabled:bg-gray-400 border border-red-500
              "
            >
              <div className="text-2xl mb-2">🔄</div>
              <div className="font-semibold">Réinitialiser la file</div>
              <div className="text-xs mt-1 opacity-75">Vider toute la file d'attente</div>
            </button>
          </div>

          {/* File d'attente résumée - Design amélioré */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-800 flex items-center space-x-2">
                <span>📋</span>
                <span>Prochains patients</span>
              </h3>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                {queue.filter(t => t.status === "en_attente").length} en attente
              </span>
            </div>
            
            {queue.filter(t => t.status === "en_attente").length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🎯</div>
                <h4 className="text-lg font-medium text-gray-600 mb-2">Aucun patient en attente</h4>
                <p className="text-gray-500">La file d'attente est vide pour le moment</p>
              </div>
            ) : (
              <div className="space-y-4">
                {queue
                  .filter(t => t.status === "en_attente")
                  .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
                  .slice(0, 5) // Afficher seulement les 5 premiers
                  .map((ticket, index) => (
                    <div 
                      key={ticket._id} 
                      className={`
                        flex justify-between items-center p-4 rounded-lg border-2 transition-all
                        ${index === 0 
                          ? "bg-green-50 border-green-200 shadow-md" 
                          : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                        }
                      `}
                    >
                      <div className="flex items-center space-x-4">
                        <span className={`
                          px-3 py-2 rounded-full text-sm font-bold
                          ${index === 0 
                            ? "bg-green-500 text-white" 
                            : "bg-blue-100 text-blue-700"
                          }
                        `}>
                          #{index + 1}
                        </span>
                        <div>
                          <span className="font-semibold text-lg">Ticket n°{ticket.number}</span>
                          {ticket.docteur && (
                            <p className="text-sm text-gray-600 mt-1">
                              👨‍⚕️ {ticket.docteur}
                            </p>
                          )}
                          {index === 0 && (
                            <span className="inline-block bg-green-500 text-white px-2 py-1 rounded text-xs font-bold mt-1">
                              ⬅️ SUIVANT
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-sm text-gray-600 mb-1">
                          {new Date(ticket.createdAt).toLocaleTimeString()}
                        </div>
                        {index > 0 && (
                          <div className="text-xs text-gray-500">
                            Attente estimée : {getEstimatedTime(index + 1)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                
                {queue.filter(t => t.status === "en_attente").length > 5 && (
                  <div className="text-center bg-gray-50 py-4 rounded-lg border border-gray-200">
                    <span className="text-gray-600 font-medium">
                      ... et {queue.filter(t => t.status === "en_attente").length - 5} patients de plus
                    </span>
                    <button
                      onClick={() => navigate("/queue")}
                      className="ml-2 text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Voir tous →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions rapides - Section améliorée */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
              <span>⚡</span>
              <span>Actions rapides</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => navigate("/admin")}
                className="
                  flex items-center space-x-3 px-4 py-3 text-gray-700 
                  hover:bg-gray-50 rounded-lg transition-colors border border-gray-200
                "
              >
                <span>⚙️</span>
                <span>Administration</span>
              </button>
              <button
                onClick={() => navigate("/")}
                className="
                  flex items-center space-x-3 px-4 py-3 text-gray-700 
                  hover:bg-gray-50 rounded-lg transition-colors border border-gray-200
                "
              >
                <span>🏠</span>
                <span>Retour à l'accueil</span>
              </button>
            </div>
          </div>

          {/* Modales de confirmation */}
          <ConfirmModal
            isOpen={showCallModal}
            title="Appeler le patient suivant"
            message="Voulez-vous appeler le patient suivant en consultation ?"
            confirmText="Oui, appeler"
            cancelText="Annuler"
            type="info"
            onConfirm={confirmCallNext}
            onCancel={() => setShowCallModal(false)}
          />

          <ConfirmModal
            isOpen={showFinishModal}
            title="Terminer la consultation"
            message={`Voulez-vous terminer la consultation du patient n°${currentPatient?.number} ?`}
            confirmText="Oui, terminer"
            cancelText="Continuer"
            type="success"
            onConfirm={confirmFinishConsultation}
            onCancel={() => setShowFinishModal(false)}
          />

          <ConfirmModal
            isOpen={showResetModal}
            title="Réinitialiser la file d'attente"
            message="⚠️ ATTENTION : Cette action supprimera TOUS les tickets de la file d'attente. Cette action est irréversible !"
            confirmText="Oui, réinitialiser"
            cancelText="Annuler"
            type="danger"
            onConfirm={confirmResetQueue}
            onCancel={() => setShowResetModal(false)}
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