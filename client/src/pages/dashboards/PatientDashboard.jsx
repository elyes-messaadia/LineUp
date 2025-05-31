import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import AnimatedPage from "../../components/AnimatedPage";
import Toast from "../../components/Toast";
import ConfirmModal from "../../components/ConfirmModal";
import { useToast } from "../../hooks/useToast";

export default function PatientDashboard() {
  const [user, setUser] = useState(null);
  const [myTicket, setMyTicket] = useState(null);
  const [queue, setQueue] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
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
    if (parsedUser.role.name !== "patient") {
      navigate("/login");
      return;
    }

    setUser(parsedUser);
    loadMyTicket();
    fetchQueue();

    // Actualiser toutes les 3 secondes
    const interval = setInterval(() => {
      loadMyTicket();
      fetchQueue();
    }, 3000);

    return () => clearInterval(interval);
  }, [navigate]);

  const loadMyTicket = () => {
    const stored = localStorage.getItem("lineup_ticket");
    if (stored) {
      try {
        const parsedTicket = JSON.parse(stored);
        setMyTicket(parsedTicket);
      } catch (error) {
        localStorage.removeItem("lineup_ticket");
      }
    }
  };

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

  const handleTakeTicket = () => {
    if (myTicket) {
      showWarning("Vous avez déjà un ticket en cours !");
      return;
    }
    setShowTicketModal(true);
  };

  const confirmTakeTicket = async () => {
    setShowTicketModal(false);
    setIsLoading(true);

    try {
      showInfo("Création de votre ticket en cours...");
      
      const res = await fetch(`${import.meta.env.VITE_API_URL}/ticket`, {
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
      localStorage.setItem("lineup_ticket", JSON.stringify(data));
      setMyTicket(data);
      
      showSuccess(`Ticket n°${data.number} créé avec succès !`, 4000);
      fetchQueue();

    } catch (error) {
      console.error("Erreur création ticket:", error);
      showError("Impossible de créer le ticket. Veuillez réessayer.", 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelTicket = () => {
    if (!myTicket) {
      showError("Aucun ticket à annuler");
      return;
    }
    
    if (myTicket.status === "en_consultation") {
      showWarning("Impossible d'annuler un ticket en consultation");
      return;
    }
    
    setShowCancelModal(true);
  };

  const confirmCancelTicket = async () => {
    if (!myTicket) return;

    setShowCancelModal(false);
    setIsLoading(true);

    try {
      showWarning("Annulation de votre ticket en cours...");

      const res = await fetch(`${import.meta.env.VITE_API_URL}/ticket/${myTicket._id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      });

      if (res.ok || res.status === 404) {
        localStorage.removeItem("lineup_ticket");
        setMyTicket(null);
        showSuccess("Ticket annulé avec succès !", 4000);
        fetchQueue();
      } else {
        throw new Error(`Erreur ${res.status}`);
      }

    } catch (error) {
      console.error("Erreur annulation:", error);
      showError("Impossible d'annuler le ticket. Veuillez réessayer.", 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("lineup_ticket");
    showInfo("Déconnexion réussie");
    navigate("/");
  };

  const getMyPosition = () => {
    if (!myTicket) return null;
    const activeTickets = queue.filter(t => t.status === "en_attente");
    const myIndex = activeTickets.findIndex(t => t._id === myTicket._id);
    return myIndex !== -1 ? myIndex + 1 : null;
  };

  const myPosition = getMyPosition();
  const waitingCount = queue.filter(t => t.status === "en_attente").length;

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
        <div className="max-w-2xl mx-auto">
          {/* En-tête utilisateur */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-xl font-bold text-blue-800">
                  👤 Espace Patient
                </h1>
                <p className="text-blue-600">
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

          {/* Mon ticket actuel */}
          {myTicket ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <h2 className="text-lg font-semibold text-yellow-800 mb-3">
                🎫 Mon ticket actuel
              </h2>
              
              <div className="space-y-2">
                <p className="text-yellow-700">
                  <strong>Numéro :</strong> {myTicket.number}
                </p>
                <p className="text-yellow-700">
                  <strong>Statut :</strong> {
                    myTicket.status === "en_attente" ? "En attente" :
                    myTicket.status === "en_consultation" ? "En consultation" :
                    myTicket.status === "termine" ? "Terminé" : "Annulé"
                  }
                </p>
                {myPosition && (
                  <p className="text-yellow-700">
                    <strong>Position :</strong> {myPosition}ème dans la file
                  </p>
                )}
                <p className="text-yellow-700">
                  <strong>Créé le :</strong> {new Date(myTicket.createdAt).toLocaleString()}
                </p>
              </div>

              {myTicket.status === "en_attente" && (
                <div className="mt-4 space-y-2">
                  <button
                    onClick={() => navigate("/queue")}
                    className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                  >
                    📋 Voir ma position en temps réel
                  </button>
                  <button
                    onClick={handleCancelTicket}
                    disabled={isLoading}
                    className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition disabled:bg-gray-400"
                  >
                    ❌ Annuler mon ticket
                  </button>
                </div>
              )}

              {myTicket.status === "en_consultation" && (
                <div className="mt-4 p-3 bg-green-100 rounded-lg">
                  <p className="text-green-800 font-semibold">
                    🩺 Vous êtes en consultation ! Rendez-vous chez le médecin.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 text-center">
              <div className="text-6xl mb-4">🎫</div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Aucun ticket actif
              </h2>
              <p className="text-gray-600 mb-4">
                Vous n'avez pas de ticket en cours. Prenez un ticket pour rejoindre la file d'attente.
              </p>
              <button
                onClick={handleTakeTicket}
                disabled={isLoading}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 font-medium"
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin inline-block mr-2">⏳</span>
                    Création...
                  </>
                ) : (
                  "🎟️ Prendre un ticket"
                )}
              </button>
            </div>
          )}

          {/* Statistiques de la file */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-800 mb-3">📊 État de la file d'attente</h3>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-blue-600">{waitingCount}</p>
                <p className="text-sm text-gray-600">Patients en attente</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {queue.filter(t => t.status === "en_consultation").length}
                </p>
                <p className="text-sm text-gray-600">En consultation</p>
              </div>
            </div>
            
            <button
              onClick={() => navigate("/queue")}
              className="w-full mt-4 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
            >
              📋 Voir la file complète
            </button>
          </div>

          {/* Actions rapides */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-3">⚡ Actions rapides</h3>
            <div className="space-y-2">
              <button
                onClick={() => navigate("/")}
                className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                🏠 Retour à l'accueil
              </button>
              <button
                onClick={() => navigate("/queue")}
                className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                📋 File d'attente en temps réel
              </button>
            </div>
          </div>

          {/* Modales */}
          <ConfirmModal
            isOpen={showTicketModal}
            title="Prendre un ticket"
            message="Voulez-vous prendre un ticket pour la consultation ? Vous rejoindrez la file d'attente."
            confirmText="Oui, prendre un ticket"
            cancelText="Annuler"
            type="info"
            onConfirm={confirmTakeTicket}
            onCancel={() => setShowTicketModal(false)}
          />

          <ConfirmModal
            isOpen={showCancelModal}
            title="Annuler le ticket"
            message={`Êtes-vous sûr de vouloir annuler votre ticket n°${myTicket?.number} ? Cette action est irréversible.`}
            confirmText="Oui, annuler"
            cancelText="Non, garder mon ticket"
            type="danger"
            onConfirm={confirmCancelTicket}
            onCancel={() => setShowCancelModal(false)}
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