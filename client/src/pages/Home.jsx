import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import AnimatedPage from "../components/AnimatedPage";
import Toast from "../components/Toast";
import ConfirmModal from "../components/ConfirmModal";
import { useToast } from "../hooks/useToast";

export default function Home() {
  const navigate = useNavigate();
  const [isPatientConnected, setIsPatientConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const { toasts, showSuccess, showError, showInfo, removeToast } = useToast();

  useEffect(() => {
    const patientStatus = localStorage.getItem("isPatient");
    if (patientStatus === "true") {
      setIsPatientConnected(true);
    }

    // Vérifier s'il y a déjà un ticket
    const existingTicket = localStorage.getItem("lineup_ticket");
    if (existingTicket) {
      showInfo("Vous avez déjà un ticket en cours", 4000);
    }
  }, [showInfo]);

  const handleTicketRequest = () => {
    // Vérifier s'il y a déjà un ticket
    const existingTicket = localStorage.getItem("lineup_ticket");
    if (existingTicket) {
      showError("Vous avez déjà un ticket en cours !");
      navigate("/ticket");
      return;
    }

    setShowConfirmModal(true);
  };

  const handleTicketConfirm = async () => {
    setShowConfirmModal(false);
    setIsLoading(true);

    try {
      showInfo("Création de votre ticket en cours...");
      
      const res = await fetch(`${import.meta.env.VITE_API_URL}/ticket`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        throw new Error(`Erreur ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      localStorage.setItem("lineup_ticket", JSON.stringify(data));
      
      showSuccess(`Ticket n°${data.number} créé avec succès !`, 4000);
      
      // Attendre un peu pour que l'utilisateur voie le message
      setTimeout(() => {
        navigate("/ticket");
      }, 1500);

    } catch (error) {
      console.error("Erreur lors de la création du ticket:", error);
      showError("Impossible de créer le ticket. Veuillez réessayer.", 5000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <AnimatedPage>
        <p className="text-gray-600 mb-6">
          Prenez un ticket pour voir le docteur
        </p>

        <button
          onClick={handleTicketRequest}
          disabled={isLoading}
          className={`px-6 py-3 rounded-lg shadow-lg transition ${
            isLoading 
              ? "bg-gray-400 cursor-not-allowed" 
              : "bg-blue-600 hover:bg-blue-700"
          } text-white`}
        >
          {isLoading ? (
            <>
              <span className="animate-spin inline-block mr-2">⏳</span>
              Création en cours...
            </>
          ) : (
            "🎟️ Prendre un ticket"
          )}
        </button>

        <a
          href="/queue"
          className="mt-4 text-blue-500 hover:underline text-sm block"
        >
          Voir la file d'attente
        </a>

        {!isPatientConnected && (
          <div className="mt-8 flex flex-col gap-3 w-full">
            <button
              onClick={() => navigate("/login-patient")}
              className="w-full border border-blue-600 text-blue-600 py-2 rounded hover:bg-blue-50 transition"
            >
              Se connecter
            </button>

            <button
              onClick={() => navigate("/register-patient")}
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
            >
              S'inscrire
            </button>
          </div>
        )}

        {/* Modal de confirmation */}
        <ConfirmModal
          isOpen={showConfirmModal}
          title="Prendre un ticket"
          message="Voulez-vous vraiment prendre un ticket pour la consultation ? Vous rejoindrez la file d'attente."
          confirmText="Oui, prendre un ticket"
          cancelText="Annuler"
          type="info"
          onConfirm={handleTicketConfirm}
          onCancel={() => setShowConfirmModal(false)}
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
