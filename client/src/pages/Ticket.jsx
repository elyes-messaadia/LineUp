import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import AnimatedPage from "../components/AnimatedPage";
import Toast from "../components/Toast";
import ConfirmModal from "../components/ConfirmModal";
import { useToast } from "../hooks/useToast";

export default function Ticket() {
  const [ticket, setTicket] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const navigate = useNavigate();
  const { toasts, showSuccess, showError, showWarning, removeToast } = useToast();

  useEffect(() => {
    const stored = localStorage.getItem("lineup_ticket");
    if (stored) {
      try {
        const parsedTicket = JSON.parse(stored);
        setTicket(parsedTicket);
        showSuccess(`Ticket n°${parsedTicket.number} actif`, 3000);
      } catch (error) {
        showError("Erreur lors du chargement du ticket");
        localStorage.removeItem("lineup_ticket");
      }
    }
  }, [showSuccess, showError]);

  const handleCancelRequest = () => {
    if (!ticket) {
      showError("Aucun ticket à annuler");
      return;
    }
    setShowCancelModal(true);
  };

  const handleCancelConfirm = async () => {
    if (!ticket) return;

    setShowCancelModal(false);
    setIsLoading(true);

    try {
      showWarning("Annulation de votre ticket en cours...");

      const res = await fetch(`${import.meta.env.VITE_API_URL}/ticket/${ticket._id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error(`Erreur ${res.status}: ${res.statusText}`);
      }

      localStorage.removeItem("lineup_ticket");
      showSuccess("Ticket annulé avec succès !", 4000);
      
      // Attendre un peu pour que l'utilisateur voie le message
      setTimeout(() => {
        navigate("/");
      }, 2000);

    } catch (error) {
      console.error("Erreur lors de l'annulation:", error);
      showError("Impossible d'annuler le ticket. Veuillez réessayer.", 5000);
    } finally {
      setIsLoading(false);
    }
  };

  if (!ticket) {
    return (
      <Layout>
        <AnimatedPage>
          <div className="text-center">
            <p className="text-sm sm:text-base text-gray-600 mb-4 px-2">Aucun ticket trouvé.</p>
            <button
              onClick={() => navigate("/")}
              className="bg-blue-600 text-white px-4 py-2 sm:py-3 rounded-lg hover:bg-blue-700 transition text-sm sm:text-base font-medium w-full sm:w-auto"
            >
              Prendre un ticket
            </button>
          </div>
        </AnimatedPage>
      </Layout>
    );
  }

  return (
    <Layout>
      <AnimatedPage>
        <div className="text-center">
          <h2 className="text-lg sm:text-xl font-semibold mb-2 text-blue-600 px-2">
            🎫 Ticket n°{ticket.number}
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mb-4 px-2 leading-relaxed">
            Heure d'enregistrement :{" "}
            {new Date(ticket.createdAt).toLocaleTimeString()}
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-6 mx-2 sm:mx-0">
            <p className="text-blue-800 text-xs sm:text-sm leading-relaxed">
              💡 <strong>Conseil :</strong> Surveillez la file d'attente pour connaître votre position.
            </p>
          </div>

          <div className="flex flex-col gap-3 px-2 sm:px-0">
            <button
              onClick={() => navigate("/queue")}
              className="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition text-sm sm:text-base font-medium w-full"
            >
              📋 Voir ma position dans la file
            </button>

            <button
              onClick={handleCancelRequest}
              disabled={isLoading}
              className={`px-4 py-3 rounded-lg transition text-sm sm:text-base font-medium w-full ${
                isLoading 
                  ? "bg-gray-400 cursor-not-allowed" 
                  : "bg-red-600 hover:bg-red-700"
              } text-white`}
            >
              {isLoading ? (
                <>
                  <span className="animate-spin inline-block mr-2">⏳</span>
                  Annulation en cours...
                </>
              ) : (
                "❌ Annuler mon ticket"
              )}
            </button>
          </div>
        </div>

        {/* Modal de confirmation d'annulation */}
        <ConfirmModal
          isOpen={showCancelModal}
          title="Annuler le ticket"
          message={`Êtes-vous sûr de vouloir annuler votre ticket n°${ticket?.number} ? Cette action est irréversible et vous devrez reprendre un nouveau ticket.`}
          confirmText="Oui, annuler"
          cancelText="Non, garder mon ticket"
          type="danger"
          onConfirm={handleCancelConfirm}
          onCancel={() => setShowCancelModal(false)}
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
