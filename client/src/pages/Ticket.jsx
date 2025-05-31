import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import AnimatedPage from "../components/AnimatedPage";
import Toast from "../components/Toast";
import ConfirmModal from "../components/ConfirmModal";
import QRCodeTicket from "../components/QRCodeTicket";
import { useToast } from "../hooks/useToast";

export default function Ticket() {
  const [ticket, setTicket] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [ticketExists, setTicketExists] = useState(true);
  const navigate = useNavigate();
  const { toasts, showSuccess, showError, showWarning, showInfo, removeToast } = useToast();

  // Fonction pour vérifier l'existence du ticket côté serveur
  const verifyTicketExists = async (ticketId) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/ticket/${ticketId}`);
      if (res.ok) {
        const serverTicket = await res.json();
        return serverTicket;
      } else if (res.status === 404) {
        return null; // Ticket n'existe plus
      } else {
        throw new Error(`Erreur ${res.status}`);
      }
    } catch (error) {
      console.error("Erreur vérification ticket:", error);
      return false; // Erreur de connexion
    }
  };

  useEffect(() => {
    const loadAndVerifyTicket = async () => {
      setIsLoading(true);
      
      const stored = localStorage.getItem("lineup_ticket");
      if (!stored) {
        setIsLoading(false);
        return;
      }

      try {
        const parsedTicket = JSON.parse(stored);
        
        // Vérifier l'existence du ticket côté serveur
        const serverTicket = await verifyTicketExists(parsedTicket._id);
        
        if (serverTicket === null) {
          // Ticket n'existe plus côté serveur
          localStorage.removeItem("lineup_ticket");
          setTicketExists(false);
          showWarning("Votre ticket a été supprimé ou n'existe plus", 5000);
        } else if (serverTicket === false) {
          // Erreur de connexion, utiliser les données locales
          setTicket(parsedTicket);
          showInfo("Mode hors ligne - Données locales", 3000);
        } else {
          // Ticket existe, utiliser les données du serveur (plus à jour)
          setTicket(serverTicket);
          
          // Mettre à jour localStorage avec les données serveur
          localStorage.setItem("lineup_ticket", JSON.stringify(serverTicket));
          
          // Vérifier si le statut a changé
          if (serverTicket.status !== parsedTicket.status) {
            switch (serverTicket.status) {
              case "en_consultation":
                showSuccess("🩺 Vous êtes en consultation !", 4000);
                break;
              case "termine":
                showInfo("✅ Votre consultation est terminée", 4000);
                break;
              case "desiste":
                showWarning("❌ Votre ticket a été annulé", 4000);
                localStorage.removeItem("lineup_ticket");
                setTimeout(() => navigate("/"), 2000);
                break;
            }
          } else {
            showSuccess(`Ticket n°${serverTicket.number} actif`, 3000);
          }
        }
      } catch (error) {
        console.error("Erreur lors du chargement du ticket:", error);
        showError("Erreur lors du chargement du ticket");
        localStorage.removeItem("lineup_ticket");
      } finally {
        setIsLoading(false);
      }
    };

    loadAndVerifyTicket();
  }, [showSuccess, showError, showWarning, showInfo, navigate]);

  const handleCancelRequest = () => {
    if (!ticket) {
      showError("Aucun ticket à annuler");
      return;
    }
    
    if (ticket.status === "en_consultation") {
      showWarning("Impossible d'annuler un ticket en consultation");
      return;
    }
    
    if (ticket.status === "termine" || ticket.status === "desiste") {
      showInfo("Ce ticket est déjà terminé ou annulé");
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
        if (res.status === 404) {
          showWarning("Le ticket a déjà été supprimé");
        } else {
          throw new Error(`Erreur ${res.status}: ${res.statusText}`);
        }
      } else {
        showSuccess("Ticket annulé avec succès !", 4000);
      }

      localStorage.removeItem("lineup_ticket");
      
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

  const handleResumeTicket = async () => {
    if (!ticket) return;

    setIsLoading(true);

    try {
      showInfo("Reprise de votre ticket en cours...");

      const res = await fetch(`${import.meta.env.VITE_API_URL}/ticket/${ticket._id}/resume`, {
        method: "PATCH",
      });

      if (!res.ok) {
        throw new Error(`Erreur ${res.status}: ${res.statusText}`);
      }

      const updatedTicket = await res.json();
      setTicket(updatedTicket.updated);
      localStorage.setItem("lineup_ticket", JSON.stringify(updatedTicket.updated));
      showSuccess("Ticket repris avec succès !", 4000);

    } catch (error) {
      console.error("Erreur lors de la reprise:", error);
      showError("Impossible de reprendre le ticket. Veuillez réessayer.", 5000);
    } finally {
      setIsLoading(false);
    }
  };

  // État de chargement
  if (isLoading) {
    return (
      <Layout>
        <AnimatedPage>
          <div className="text-center">
            <div className="animate-spin text-4xl mb-4">⏳</div>
            <p className="text-sm sm:text-base text-gray-600">Vérification de votre ticket...</p>
          </div>
        </AnimatedPage>
      </Layout>
    );
  }

  // Ticket n'existe pas ou plus
  if (!ticket || !ticketExists) {
    return (
      <Layout>
        <AnimatedPage>
          <div className="text-center">
            <div className="text-6xl mb-4">🎫</div>
            <h2 className="text-lg sm:text-xl font-semibold mb-2 text-gray-700">
              Aucun ticket actif
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mb-4 px-2">
              {!ticketExists 
                ? "Votre ticket n'existe plus ou a été supprimé." 
                : "Vous n'avez pas de ticket en cours."
              }
            </p>
            <button
              onClick={() => navigate("/")}
              className="bg-blue-600 text-white px-4 py-2 sm:py-3 rounded-lg hover:bg-blue-700 transition text-sm sm:text-base font-medium w-full sm:w-auto"
            >
              Prendre un nouveau ticket
            </button>
          </div>
        </AnimatedPage>
      </Layout>
    );
  }

  // Affichage du statut avec couleurs
  const getStatusDisplay = () => {
    switch (ticket.status) {
      case "en_consultation":
        return (
          <div className="bg-green-100 border border-green-300 rounded-lg p-3 sm:p-4 mb-6 mx-2 sm:mx-0">
            <p className="text-green-800 text-sm sm:text-base font-semibold">
              🩺 <strong>En consultation</strong> - Vous êtes actuellement avec le médecin
            </p>
          </div>
        );
      case "termine":
        return (
          <div className="bg-gray-100 border border-gray-300 rounded-lg p-3 sm:p-4 mb-6 mx-2 sm:mx-0">
            <p className="text-gray-800 text-sm sm:text-base font-semibold">
              ✅ <strong>Consultation terminée</strong> - Merci de votre visite
            </p>
          </div>
        );
      case "desiste":
        return (
          <div className="bg-red-100 border border-red-300 rounded-lg p-3 sm:p-4 mb-6 mx-2 sm:mx-0">
            <p className="text-red-800 text-sm sm:text-base font-semibold">
              ❌ <strong>Ticket annulé</strong>
            </p>
          </div>
        );
      default:
        return (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-6 mx-2 sm:mx-0">
            <p className="text-blue-800 text-xs sm:text-sm leading-relaxed">
              💡 <strong>Conseil :</strong> Surveillez la file d'attente pour connaître votre position.
            </p>
          </div>
        );
    }
  };

  return (
    <Layout>
      <AnimatedPage>
        <div className="text-center">
          <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 max-w-md mx-auto">
            <div className="text-4xl sm:text-5xl mb-4">🎫</div>
            <h1 className="text-xl sm:text-2xl font-bold mb-2">
              Ticket n°{ticket.number}
            </h1>
            
            {/* Affichage du statut */}
            <div className="mb-6">
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                ticket.status === "en_attente" ? "bg-yellow-100 text-yellow-800" :
                ticket.status === "en_consultation" ? "bg-green-100 text-green-800" :
                ticket.status === "termine" ? "bg-gray-100 text-gray-800" :
                "bg-red-100 text-red-800"
              }`}>
                {getStatusDisplay()}
              </span>
            </div>

            {/* QR Code */}
            <div className="mb-6">
              <QRCodeTicket ticketNumber={ticket.number} />
            </div>

            {/* Actions */}
            <div className="space-y-3">
              {ticket.status === "en_attente" && (
                <button
                  onClick={handleCancelRequest}
                  disabled={isLoading}
                  className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                >
                  ❌ Annuler mon ticket
                </button>
              )}

              {ticket.status === "desiste" && (
                <button
                  onClick={handleResumeTicket}
                  disabled={isLoading}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                >
                  🔄 Reprendre mon ticket
                </button>
              )}

              <button
                onClick={() => navigate("/queue")}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                📋 Voir la file d'attente
              </button>
            </div>

            {/* Conseil */}
            <div className="mt-6 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                💡 Gardez cette page ouverte pour suivre votre position
              </p>
            </div>
          </div>

          {/* Modal de confirmation d'annulation */}
          <ConfirmModal
            isOpen={showCancelModal}
            title="Annuler le ticket"
            message="Êtes-vous sûr de vouloir annuler votre ticket ? Vous perdrez votre place dans la file d'attente."
            confirmText="Oui, annuler"
            cancelText="Non, garder"
            type="warning"
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
        </div>
      </AnimatedPage>
    </Layout>
  );
}
