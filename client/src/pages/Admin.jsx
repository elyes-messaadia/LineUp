import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import AnimatedPage from "../components/AnimatedPage";
import Toast from "../components/Toast";
import ConfirmModal from "../components/ConfirmModal";
import { useToast } from "../hooks/useToast";

export default function Admin() {
  const navigate = useNavigate();
  const [queue, setQueue] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const { toasts, showSuccess, showError, showWarning, showInfo, removeToast } = useToast();

  useEffect(() => {
    const isAdmin = localStorage.getItem("isAdmin");
    if (isAdmin !== "true") {
      navigate("/admin-login");
    }

    fetchQueue();
    const interval = setInterval(fetchQueue, 3000);
    return () => clearInterval(interval);
  }, [navigate]);

  const fetchQueue = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/queue`);
      if (!res.ok) throw new Error("Erreur de récupération");
      const data = await res.json();
      setQueue(data);
    } catch (error) {
      showError("Impossible de charger la file d'attente");
    }
  };

  const handleCallNextRequest = () => {
    const nextPatient = queue.find(t => t.status === "en_attente");
    if (!nextPatient) {
      showWarning("Aucun patient en attente");
      return;
    }
    setShowCallModal(true);
  };

  const handleCallNextConfirm = async () => {
    setShowCallModal(false);
    setIsLoading(true);

    try {
      showInfo("Appel du patient suivant...");
      
      const res = await fetch(`${import.meta.env.VITE_API_URL}/next`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Erreur lors de l'appel");

      const data = await res.json();
      showSuccess(`Patient n°${data.called?.number} appelé en consultation !`, 4000);
      fetchQueue();
    } catch (error) {
      showError("Impossible d'appeler le patient suivant");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetRequest = () => {
    if (queue.length === 0) {
      showInfo("La file d'attente est déjà vide");
      return;
    }
    setShowResetModal(true);
  };

  const handleResetConfirm = async () => {
    setShowResetModal(false);
    setIsLoading(true);

    try {
      showWarning("Réinitialisation de la file d'attente...");
      
      const res = await fetch(`${import.meta.env.VITE_API_URL}/reset`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Erreur lors de la réinitialisation");

      showSuccess("File d'attente réinitialisée avec succès !", 4000);
      fetchQueue();
    } catch (error) {
      showError("Impossible de réinitialiser la file d'attente");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinishRequest = (ticketId, ticketNumber) => {
    setSelectedTicketId({ id: ticketId, number: ticketNumber });
    setShowFinishModal(true);
  };

  const handleFinishConfirm = async () => {
    if (!selectedTicketId) return;

    setShowFinishModal(false);
    setIsLoading(true);

    try {
      showInfo("Finalisation de la consultation...");
      
      const res = await fetch(`${import.meta.env.VITE_API_URL}/ticket/${selectedTicketId.id}/finish`, {
        method: "PATCH",
      });

      if (!res.ok) throw new Error("Erreur lors de la finalisation");

      showSuccess(`Consultation du patient n°${selectedTicketId.number} terminée !`, 4000);
      fetchQueue();
    } catch (error) {
      showError("Impossible de terminer la consultation");
    } finally {
      setIsLoading(false);
      setSelectedTicketId(null);
    }
  };

  // 🎯 Tri des statuts
  const sortedQueue = [...queue].sort((a, b) => {
    const order = {
      en_attente: 1,
      en_consultation: 2,
      desiste: 3,
      termine: 4,
    };
    return order[a.status] - order[b.status];
  });

  const waitingCount = queue.filter(t => t.status === "en_attente").length;
  const inConsultationCount = queue.filter(t => t.status === "en_consultation").length;

  return (
    <Layout>
      <AnimatedPage>
        <h1 className="text-2xl font-bold mb-4 text-blue-700 text-center">
          Tableau de bord médecin
        </h1>

        {/* Statistiques */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">{waitingCount}</p>
              <p className="text-sm text-blue-800">En attente</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{inConsultationCount}</p>
              <p className="text-sm text-green-800">En consultation</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            localStorage.removeItem("isAdmin");
            showInfo("Déconnexion réussie");
            navigate("/admin-login");
          }}
          className="mb-4 text-sm text-red-600 underline hover:text-red-800"
        >
          🔒 Se déconnecter
        </button>

        <button
          onClick={handleCallNextRequest}
          disabled={isLoading || waitingCount === 0}
          className={`mb-4 w-full py-2 rounded transition ${
            isLoading || waitingCount === 0
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700"
          } text-white`}
        >
          {isLoading ? (
            <>
              <span className="animate-spin inline-block mr-2">⏳</span>
              Traitement...
            </>
          ) : (
            `✅ Appeler le suivant ${waitingCount > 0 ? `(${waitingCount} en attente)` : "(aucun patient)"}`
          )}
        </button>

        <button
          onClick={handleResetRequest}
          disabled={isLoading}
          className={`mb-6 w-full py-2 rounded transition ${
            isLoading 
              ? "bg-gray-400 cursor-not-allowed" 
              : "bg-red-600 hover:bg-red-700"
          } text-white`}
        >
          🗑️ Réinitialiser la file
        </button>

        <ul className="space-y-2">
          {sortedQueue.map((t) => {
            let badge;
            if (t.status === "en_attente") {
              badge = (
                <span className="inline-block bg-yellow-100 text-yellow-700 text-xs font-semibold px-2 py-1 rounded-full">
                  En attente
                </span>
              );
            } else if (t.status === "en_consultation") {
              badge = (
                <span className="inline-block bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full animate-pulse">
                  En consultation
                </span>
              );
            } else if (t.status === "desiste") {
              badge = (
                <span className="inline-block bg-red-100 text-red-700 text-xs font-semibold px-2 py-1 rounded-full">
                  Désisté
                </span>
              );
            } else if (t.status === "termine") {
              badge = (
                <span className="inline-block bg-gray-200 text-gray-700 text-xs font-semibold px-2 py-1 rounded-full">
                  Terminé
                </span>
              );
            }

            return (
              <li
                key={t._id}
                className={`p-3 rounded border flex justify-between items-center ${
                  t.status === "desiste"
                    ? "line-through italic bg-red-50 border-red-300"
                    : t.status === "termine"
                    ? "bg-gray-100 border-gray-400 text-gray-600"
                    : "bg-white"
                }`}
              >
                <span>
                  🎫 {t.number} • {badge}
                </span>

                {t.status === "en_consultation" && (
                  <button
                    onClick={() => handleFinishRequest(t._id, t.number)}
                    disabled={isLoading}
                    className={`text-xs px-2 py-1 rounded ml-2 transition ${
                      isLoading 
                        ? "bg-gray-200 cursor-not-allowed" 
                        : "bg-gray-300 hover:bg-gray-400"
                    } text-black`}
                  >
                    Terminer
                  </button>
                )}
              </li>
            );
          })}
        </ul>

        {/* Modal appeler suivant */}
        <ConfirmModal
          isOpen={showCallModal}
          title="Appeler le patient suivant"
          message="Voulez-vous appeler le patient suivant en consultation ?"
          confirmText="Oui, appeler"
          cancelText="Annuler"
          type="info"
          onConfirm={handleCallNextConfirm}
          onCancel={() => setShowCallModal(false)}
        />

        {/* Modal réinitialiser */}
        <ConfirmModal
          isOpen={showResetModal}
          title="Réinitialiser la file d'attente"
          message={`Voulez-vous vraiment supprimer tous les ${queue.length} tickets de la file d'attente ? Cette action est irréversible.`}
          confirmText="Oui, réinitialiser"
          cancelText="Annuler"
          type="danger"
          onConfirm={handleResetConfirm}
          onCancel={() => setShowResetModal(false)}
        />

        {/* Modal terminer consultation */}
        <ConfirmModal
          isOpen={showFinishModal}
          title="Terminer la consultation"
          message={`Voulez-vous marquer la consultation du patient n°${selectedTicketId?.number} comme terminée ?`}
          confirmText="Oui, terminer"
          cancelText="Annuler"
          type="info"
          onConfirm={handleFinishConfirm}
          onCancel={() => {
            setShowFinishModal(false);
            setSelectedTicketId(null);
          }}
        />

        {/* Notifications Toast */}
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </AnimatedPage>
    </Layout>
  );
}
