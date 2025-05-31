import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import AnimatedPage from "../../components/AnimatedPage";
import Toast from "../../components/Toast";
import { useToast } from "../../hooks/useToast";

export default function VisiteurDashboard() {
  const [user, setUser] = useState(null);
  const [queue, setQueue] = useState([]);
  const [currentTime, setCurrentTime] = useState(Date.now());
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
    fetchQueue();

    // Actualiser toutes les 3 secondes
    const interval = setInterval(() => {
      fetchQueue();
      setCurrentTime(Date.now());
    }, 3000);

    return () => clearInterval(interval);
  }, [navigate]);

  const fetchQueue = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/queue`);
      if (res.ok) {
        const data = await res.json();
        setQueue(data);
      }
    } catch (error) {
      // Silencieux pour ne pas spam les erreurs
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
        <div className="max-w-4xl mx-auto">
          {/* En-tête utilisateur */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-xl font-bold text-purple-800">
                  👁️ Espace Visiteur
                </h1>
                <p className="text-purple-600">
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

          {/* Statistiques générales */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{waitingCount}</p>
              <p className="text-sm text-blue-800">En attente</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{inConsultationCount}</p>
              <p className="text-sm text-green-800">En consultation</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-gray-600">{completedToday}</p>
              <p className="text-sm text-gray-800">Terminées</p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-yellow-600">{totalToday}</p>
              <p className="text-sm text-yellow-800">Total du jour</p>
            </div>
          </div>

          {/* Temps d'attente estimé */}
          {waitingCount > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-orange-800 mb-2">⏱️ Temps d'attente estimé</h3>
              <p className="text-orange-700">
                Si vous preniez un ticket maintenant, vous seriez en position <strong>{waitingCount + 1}</strong> 
                {" "}avec une attente d'environ <strong>{getEstimatedTime(waitingCount + 1)}</strong>.
              </p>
            </div>
          )}

          {/* File d'attente en temps réel */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">
                📋 File d'attente en temps réel
              </h2>
              <span className="text-sm text-gray-500">
                Mise à jour : {new Date(currentTime).toLocaleTimeString()}
              </span>
            </div>

            {queue.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">🎯</div>
                <p>Aucun patient dans la file d'attente</p>
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
                      <div key={ticket._id} className={`border rounded-lg p-3 ${bgColor}`}>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-gray-800">
                              🎫 Ticket n°{ticket.number}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusInfo.bg} ${statusInfo.color}`}>
                              {statusInfo.text}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(ticket.createdAt).toLocaleTimeString()}
                          </div>
                        </div>
                        
                        {ticket.status === "en_attente" && (
                          <div className="mt-2 text-sm text-gray-600">
                            Temps d'attente estimé : {getEstimatedTime(queue.filter(t => t.status === "en_attente").findIndex(t => t._id === ticket._id) + 1)}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Informations pour créer un compte */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-800 mb-2">💡 Conseil</h3>
            <p className="text-blue-700 text-sm">
              En tant que visiteur, vous pouvez seulement consulter la file d'attente. 
              Pour prendre un ticket, vous devez <strong>créer un compte Patient</strong> ou vous 
              rendre directement à l'accueil.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => navigate("/register")}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
              >
                ✨ Créer un compte Patient
              </button>
              <button
                onClick={() => navigate("/")}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition text-sm"
              >
                🏠 Retour à l'accueil
              </button>
            </div>
          </div>

          {/* Actions rapides */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-3">⚡ Actions disponibles</h3>
            <div className="space-y-2">
              <button
                onClick={() => navigate("/queue")}
                className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                📋 File d'attente page complète
              </button>
              <button
                onClick={() => navigate("/register")}
                className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                ✨ Devenir patient
              </button>
              <button
                onClick={() => navigate("/")}
                className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                🏠 Retour à l'accueil
              </button>
            </div>
          </div>

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