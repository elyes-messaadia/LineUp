import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import AnimatedPage from "../../components/AnimatedPage";
import Toast from "../../components/Toast";
import ConfirmModal from "../../components/ConfirmModal";
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
        <div className="max-w-6xl mx-auto">
          {/* En-tête médecin */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-xl font-bold text-green-800">
                  🩺 Espace Médecin
                </h1>
                <p className="text-green-600">
                  Bienvenue Dr. {user.fullName}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="text-sm text-red-600 hover:text-red-800 underline"
              >
                🔒 Déconnexion
              </button>
            </div>
          </div>

          {/* Patient en consultation */}
          {currentPatient ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h2 className="text-lg font-semibold text-blue-800 mb-3">
                👨‍⚕️ Patient en consultation
              </h2>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-blue-700">
                    <strong>Ticket n°{currentPatient.number}</strong>
                  </p>
                  <p className="text-sm text-blue-600">
                    Début : {new Date(currentPatient.updatedAt).toLocaleTimeString()}
                  </p>
                </div>
                <button
                  onClick={handleFinishConsultation}
                  disabled={isLoading}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition disabled:bg-gray-400"
                >
                  ✅ Terminer la consultation
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 text-center">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">
                Aucun patient en consultation
              </h2>
              <p className="text-gray-600 mb-4">
                Appelez le patient suivant pour commencer une consultation
              </p>
            </div>
          )}

          {/* Statistiques du jour */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.waitingCount}</p>
              <p className="text-sm text-blue-800">En attente</p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-yellow-600">{stats.inConsultationCount}</p>
              <p className="text-sm text-yellow-800">En consultation</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{stats.completedToday}</p>
              <p className="text-sm text-green-800">Terminées</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-red-600">{stats.cancelledToday}</p>
              <p className="text-sm text-red-800">Annulées</p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-purple-600">{stats.totalToday}</p>
              <p className="text-sm text-purple-800">Total du jour</p>
            </div>
          </div>

          {/* Actions principales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <button
              onClick={handleCallNext}
              disabled={isLoading || currentPatient}
              className={`p-4 rounded-lg transition font-medium ${
                currentPatient 
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              📢 Appeler le patient suivant
            </button>

            <button
              onClick={() => navigate("/queue")}
              className="p-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
            >
              📋 Voir la file complète
            </button>

            <button
              onClick={handleResetQueue}
              disabled={isLoading}
              className="p-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium disabled:bg-gray-400"
            >
              🔄 Réinitialiser la file
            </button>
          </div>

          {/* File d'attente résumée */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-800 mb-4">📋 Prochains patients</h3>
            
            {queue.filter(t => t.status === "en_attente").length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">🎯</div>
                <p>Aucun patient en attente</p>
              </div>
            ) : (
              <div className="space-y-2">
                {queue
                  .filter(t => t.status === "en_attente")
                  .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
                  .slice(0, 5) // Afficher seulement les 5 premiers
                  .map((ticket, index) => (
                    <div key={ticket._id} className="flex justify-between items-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          index === 0 ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                        }`}>
                          Position {index + 1}
                        </span>
                        <span className="font-semibold">Ticket n°{ticket.number}</span>
                        {index === 0 && <span className="text-green-600 font-semibold">⬅️ SUIVANT</span>}
                      </div>
                      <div className="text-sm text-gray-600">
                        <span>{new Date(ticket.createdAt).toLocaleTimeString()}</span>
                        {index > 0 && (
                          <span className="ml-2">({getEstimatedTime(index + 1)} d'attente)</span>
                        )}
                      </div>
                    </div>
                  ))}
                
                {queue.filter(t => t.status === "en_attente").length > 5 && (
                  <div className="text-center text-gray-500 py-2">
                    ... et {queue.filter(t => t.status === "en_attente").length - 5} patients de plus
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions rapides */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-3">⚡ Actions rapides</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => navigate("/admin")}
                className="text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                ⚙️ Interface admin
              </button>
              <button
                onClick={() => navigate("/queue")}
                className="text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                📋 File d'attente détaillée
              </button>
              <button
                onClick={() => navigate("/")}
                className="text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                🏠 Retour à l'accueil
              </button>
              <button
                onClick={handleLogout}
                className="text-left px-4 py-2 text-red-600 hover:bg-red-100 rounded-lg transition"
              >
                🔒 Déconnexion
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