import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import AnimatedPage from "../../components/AnimatedPage";
import Toast from "../../components/Toast";
import ConfirmModal from "../../components/ConfirmModal";
import { useToast } from "../../hooks/useToast";
import BACKEND_URL from "../../config/api";

export default function SecretaireDashboard() {
  const [user, setUser] = useState(null);
  const [queue, setQueue] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [showCreateTicketModal, setShowCreateTicketModal] = useState(false);
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
  }, [navigate]);

  const fetchQueue = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/queue`);
      if (res.ok) {
        const data = await res.json();
        setQueue(data);
        fetchStats();
      }
    } catch (error) {
      console.error("Erreur chargement queue:", error);
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

  const handleCallNext = () => {
    const nextPatient = queue
      .filter(t => t.status === "en_attente")
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))[0];

    if (!nextPatient) {
      showWarning("Aucun patient en attente");
      return;
    }

    const currentPatient = queue.find(t => t.status === "en_consultation");
    if (currentPatient) {
      showWarning("Un patient est déjà en consultation. Coordonnez-vous avec le médecin.");
      return;
    }

    setShowCallModal(true);
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
      showSuccess(`Patient n°${data.called.number} appelé en consultation !`, 4000);
      fetchQueue();

    } catch (error) {
      console.error("Erreur appel patient:", error);
      showError("Impossible d'appeler le patient suivant", 5000);
    } finally {
      setIsLoading(false);
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
        body: JSON.stringify({ userId: user._id })
      });

      if (!res.ok) {
        throw new Error(`Erreur ${res.status}`);
      }

      const data = await res.json();
      showSuccess(`Ticket n°${data.number} créé pour un patient !`, 4000);
      fetchQueue();

    } catch (error) {
      console.error("Erreur création ticket:", error);
      showError("Impossible de créer le ticket", 5000);
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
          {/* En-tête secrétaire */}
          <div className="bg-pink-50 border border-pink-200 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-xl font-bold text-pink-800">
                  👩‍💼 Espace Secrétaire
                </h1>
                <p className="text-pink-600">
                  Bienvenue {user.fullName}
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

          {/* Statistiques du jour */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
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
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-orange-600">{stats.averageWaitTime}</p>
              <p className="text-sm text-orange-800">Attente (min)</p>
            </div>
          </div>

          {/* Actions principales */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <button
              onClick={handleCreateTicket}
              disabled={isLoading}
              className="p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:bg-gray-400"
            >
              🎟️ Créer un ticket
            </button>

            <button
              onClick={handleCallNext}
              disabled={isLoading}
              className="p-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:bg-gray-400"
            >
              📢 Appeler le suivant
            </button>

            <button
              onClick={() => navigate("/queue")}
              className="p-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
            >
              📋 File complète
            </button>

            <button
              onClick={() => navigate("/admin")}
              className="p-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
            >
              ⚙️ Gestion admin
            </button>
          </div>

          {/* État actuel */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Patient en consultation */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">👨‍⚕️ Patient en consultation</h3>
              {queue.find(t => t.status === "en_consultation") ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-green-700 font-semibold">
                    Ticket n°{queue.find(t => t.status === "en_consultation").number}
                  </p>
                  <p className="text-sm text-green-600">
                    Depuis : {new Date(queue.find(t => t.status === "en_consultation").updatedAt).toLocaleTimeString()}
                  </p>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                  <p className="text-gray-500">Aucun patient en consultation</p>
                </div>
              )}
            </div>

            {/* Prochain patient */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">⏭️ Prochain patient</h3>
              {queue.filter(t => t.status === "en_attente")[0] ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-blue-700 font-semibold">
                    Ticket n°{queue.filter(t => t.status === "en_attente")[0].number}
                  </p>
                  <p className="text-sm text-blue-600">
                    Arrivé à : {new Date(queue.filter(t => t.status === "en_attente")[0].createdAt).toLocaleTimeString()}
                  </p>
                  <p className="text-sm text-blue-600">
                    Attente : {getEstimatedTime(1)}
                  </p>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                  <p className="text-gray-500">Aucun patient en attente</p>
                </div>
              )}
            </div>
          </div>

          {/* File d'attente résumée */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-800">📋 File d'attente</h3>
              <span className="text-sm text-gray-500">
                Mise à jour automatique toutes les 5 secondes
              </span>
            </div>
            
            {queue.filter(t => t.status === "en_attente").length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">🎯</div>
                <p>Aucun patient en attente</p>
                <button
                  onClick={handleCreateTicket}
                  className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  🎟️ Créer le premier ticket
                </button>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {queue
                  .filter(t => t.status === "en_attente")
                  .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
                  .map((ticket, index) => (
                    <div key={ticket._id} className={`flex justify-between items-center p-3 rounded-lg border ${
                      index === 0 ? "bg-green-50 border-green-200" : "bg-blue-50 border-blue-200"
                    }`}>
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
                        <span className="ml-2">({getEstimatedTime(index + 1)} d'attente)</span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Tableau de bord rapide */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Actions fréquentes */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">⚡ Actions fréquentes</h3>
              <div className="space-y-2">
                <button
                  onClick={handleCreateTicket}
                  className="w-full text-left px-4 py-2 text-gray-700 hover:bg-blue-100 rounded-lg transition"
                >
                  🎟️ Créer un ticket pour un patient
                </button>
                <button
                  onClick={() => navigate("/queue")}
                  className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
                >
                  📋 Voir la file détaillée
                </button>
                <button
                  onClick={() => navigate("/admin")}
                  className="w-full text-left px-4 py-2 text-gray-700 hover:bg-purple-100 rounded-lg transition"
                >
                  👥 Gérer les utilisateurs
                </button>
                <button
                  onClick={() => navigate("/")}
                  className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
                >
                  🏠 Retour à l'accueil
                </button>
              </div>
            </div>

            {/* Informations utiles */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">ℹ️ Informations</h3>
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Temps moyen par consultation :</strong> 15 minutes
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>Heure de pointe :</strong> 9h-11h et 14h-16h
                  </p>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Capacité recommandée :</strong> 4 patients/heure max
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Modales de confirmation */}
          <ConfirmModal
            isOpen={showCallModal}
            title="Appeler le patient suivant"
            message="Voulez-vous appeler le patient suivant en consultation ? Assurez-vous que le médecin est prêt."
            confirmText="Oui, appeler"
            cancelText="Annuler"
            type="info"
            onConfirm={confirmCallNext}
            onCancel={() => setShowCallModal(false)}
          />

          <ConfirmModal
            isOpen={showCreateTicketModal}
            title="Créer un ticket"
            message="Voulez-vous créer un ticket pour un patient qui se présente à l'accueil ?"
            confirmText="Oui, créer"
            cancelText="Annuler"
            type="info"
            onConfirm={confirmCreateTicket}
            onCancel={() => setShowCreateTicketModal(false)}
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