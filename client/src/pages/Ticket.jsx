import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import AnimatedPage from "../components/AnimatedPage";
import Toast from "../components/Toast";
import ConfirmModal from "../components/ConfirmModal";
import QRCodeTicket from "../components/QRCodeTicket";
import { useToast } from "../hooks/useToast";
import BACKEND_URL from "../config/api";

export default function Ticket() {
  const [ticket, setTicket] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [ticketExists, setTicketExists] = useState(true);
  const navigate = useNavigate();
  const { 
    toasts, 
    showSuccess, 
    showError, 
    showWarning, 
    showInfo, 
    showImportant, 
    removeToast 
  } = useToast();

  // Référence pour éviter les boucles d'update
  const pollIntervalRef = useRef(null);
  const lastStatusRef = useRef(null);
  const isActiveRef = useRef(true);

  // Fonction pour vérifier l'existence du ticket côté serveur
  const verifyTicketExists = useCallback(async (ticketId, sessionId) => {
    try {
      let url = `${BACKEND_URL}/ticket/${ticketId}`;
      // Si c'est un ticket anonyme, ajouter le sessionId dans la requête
      if (sessionId) {
        url += `?sessionId=${sessionId}`;
      }

      const res = await fetch(url);
      
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
  }, []);

  // Fonction pour surveiller les changements de statut
  const monitorTicketStatus = useCallback(async () => {
    if (!ticket || !isActiveRef.current) return;

    try {
      const serverTicket = await verifyTicketExists(
        ticket._id,
        ticket.isAnonymous ? ticket.sessionId : null
      );

      if (serverTicket === null) {
        // Ticket supprimé côté serveur
        localStorage.removeItem("lineup_ticket");
        setTicketExists(false);
        showImportant("❌ Votre ticket a été supprimé ou annulé", 8000);
        setTimeout(() => navigate("/"), 3000);
        return;
      }

      if (serverTicket === false) {
        // Erreur de connexion, ne rien faire
        return;
      }

      // Vérifier si le statut a changé
      if (lastStatusRef.current && lastStatusRef.current !== serverTicket.status) {
        switch (serverTicket.status) {
          case "en_consultation":
            showImportant("🩺 C'est votre tour ! Veuillez vous présenter au cabinet médical", 10000);
            break;
          case "termine":
            showImportant("✅ Votre consultation est terminée. Merci de votre visite !", 8000);
            setTimeout(() => navigate("/"), 5000);
            break;
          case "desiste":
            showImportant("❌ Votre ticket a été annulé", 8000);
            localStorage.removeItem("lineup_ticket");
            setTimeout(() => navigate("/"), 3000);
            break;
          case "en_attente":
            showInfo("⏱️ Votre ticket est de retour en attente", 4000, true);
            break;
        }
      }

      // Mettre à jour les données du ticket
      setTicket(prev => ({
        ...prev,
        ...serverTicket,
        isAnonymous: prev?.isAnonymous,
        sessionId: prev?.sessionId
      }));

      // Mettre à jour localStorage
      localStorage.setItem("lineup_ticket", JSON.stringify({
        ...serverTicket,
        isAnonymous: ticket.isAnonymous,
        sessionId: ticket.sessionId
      }));

      lastStatusRef.current = serverTicket.status;

    } catch (error) {
      console.error("Erreur monitoring ticket:", error);
    }
  }, [ticket, verifyTicketExists, showImportant, showInfo, navigate]);

  // Démarrer la surveillance automatique
  const startMonitoring = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
    
    // Surveiller toutes les 2 secondes
    pollIntervalRef.current = setInterval(monitorTicketStatus, 2000);
  }, [monitorTicketStatus]);

  // Arrêter la surveillance
  const stopMonitoring = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    const loadAndVerifyTicket = async () => {
      setIsLoading(true);
      isActiveRef.current = true;

      const stored = localStorage.getItem("lineup_ticket");
      if (!stored) {
        setIsLoading(false);
        return;
      }

      try {
        const parsedTicket = JSON.parse(stored);

        // Vérifier l'existence du ticket côté serveur
        const serverTicket = await verifyTicketExists(
          parsedTicket._id,
          parsedTicket.isAnonymous ? parsedTicket.sessionId : null
        );

        if (serverTicket === null) {
          // Ticket n'existe plus côté serveur
          localStorage.removeItem("lineup_ticket");
          setTicketExists(false);
          showWarning("Votre ticket a été supprimé ou n'existe plus", 5000, true);
        } else if (serverTicket === false) {
          // Erreur de connexion, utiliser les données locales
          setTicket(parsedTicket);
          lastStatusRef.current = parsedTicket.status;
          showInfo("Mode hors ligne - Données locales", 3000);
          // Démarrer la surveillance même en mode hors ligne
          startMonitoring();
        } else {
          // Ticket existe, utiliser les données du serveur (plus à jour)
          const fullTicket = {
            ...serverTicket,
            isAnonymous: parsedTicket.isAnonymous,
            sessionId: parsedTicket.sessionId
          };
          
          setTicket(fullTicket);
          lastStatusRef.current = serverTicket.status;

          // Mettre à jour localStorage avec les données serveur
          localStorage.setItem("lineup_ticket", JSON.stringify(fullTicket));

          // Vérifier si le statut a changé depuis la dernière visite
          if (serverTicket.status !== parsedTicket.status) {
            switch (serverTicket.status) {
              case "en_consultation":
                showImportant("🩺 Vous êtes en consultation ! Présentez-vous au cabinet", 8000);
                break;
              case "termine":
                showInfo("✅ Votre consultation est terminée", 4000);
                break;
              case "desiste":
                showWarning("❌ Votre ticket a été annulé", 4000, true);
                localStorage.removeItem("lineup_ticket");
                setTimeout(() => navigate("/"), 2000);
                break;
            }
          } else {
            // Notification d'accueil selon le statut
            switch (serverTicket.status) {
              case "en_attente":
                showSuccess(`Ticket n°${serverTicket.number} - En attente`, 3000);
                break;
              case "en_consultation":
                showImportant("🩺 Vous êtes en consultation ! Présentez-vous au cabinet", 8000);
                break;
              case "termine":
                showInfo("✅ Votre consultation est terminée", 4000);
                break;
            }
          }

          // Démarrer la surveillance temps réel
          startMonitoring();
        }
      } catch (error) {
        console.error("Erreur lors du chargement du ticket:", error);
        showError("Erreur lors du chargement du ticket", 5000, true);
        localStorage.removeItem("lineup_ticket");
        setTicketExists(false);
      } finally {
        setIsLoading(false);
      }
    };

    loadAndVerifyTicket();

    // Cleanup
    return () => {
      isActiveRef.current = false;
      stopMonitoring();
    };
  }, [verifyTicketExists, showSuccess, showError, showWarning, showInfo, showImportant, navigate, startMonitoring, stopMonitoring]);

  // Gestion de la visibilité de la page pour optimiser la surveillance
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page cachée : surveillance moins fréquente
        stopMonitoring();
        if (ticket && isActiveRef.current) {
          pollIntervalRef.current = setInterval(monitorTicketStatus, 5000);
        }
      } else {
        // Page visible : surveillance normale + vérification immédiate
        stopMonitoring();
        startMonitoring();
        monitorTicketStatus();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [ticket, monitorTicketStatus, startMonitoring, stopMonitoring]);

  const handleCancelRequest = () => {
    if (!ticket) {
      showError("Aucun ticket à annuler", 3000, true);
      return;
    }

    if (ticket.status === "en_consultation") {
      showWarning("Impossible d'annuler un ticket en consultation", 4000, true);
      return;
    }

    if (ticket.status === "termine" || ticket.status === "desiste") {
      showInfo("Ce ticket est déjà terminé ou annulé", 3000);
      return;
    }

    setShowCancelModal(true);
  };

  const handleCancelConfirm = async () => {
    if (!ticket) return;

    setShowCancelModal(false);
    setIsLoading(true);
    stopMonitoring(); // Arrêter la surveillance pendant l'annulation

    try {
      showWarning("Annulation de votre ticket en cours...", 3000, true);

      let url = `${BACKEND_URL}/ticket/${ticket._id}`;
      // Si c'est un ticket anonyme, ajouter le sessionId dans la requête
      if (ticket.isAnonymous && ticket.sessionId) {
        url += `?sessionId=${ticket.sessionId}`;
      }

      const res = await fetch(url, {
        method: "DELETE",
      });

      if (!res.ok) {
        if (res.status === 404) {
          showWarning("Le ticket a déjà été supprimé", 4000, true);
        } else {
          throw new Error(`Erreur ${res.status}: ${res.statusText}`);
        }
      } else {
        showSuccess("Ticket annulé avec succès !", 4000, true);
      }

      localStorage.removeItem("lineup_ticket");

      // Attendre un peu pour que l'utilisateur voie le message
      setTimeout(() => {
        navigate("/");
      }, 2000);

    } catch (error) {
      console.error("Erreur lors de l'annulation:", error);
      showError("Impossible d'annuler le ticket. Veuillez réessayer.", 5000, true);
      startMonitoring(); // Reprendre la surveillance en cas d'échec
    } finally {
      setIsLoading(false);
    }
  };

  const handleResumeTicket = async () => {
    if (!ticket) return;

    setIsLoading(true);
    stopMonitoring(); // Arrêter temporairement la surveillance

    try {
      showInfo("Reprise de votre ticket en cours...", 3000, true);

      let url = `${BACKEND_URL}/ticket/${ticket._id}/resume`;
      // Si c'est un ticket anonyme, ajouter le sessionId dans la requête
      if (ticket.isAnonymous && ticket.sessionId) {
        url += `?sessionId=${ticket.sessionId}`;
      }

      const res = await fetch(url, {
        method: "PATCH",
      });

      if (!res.ok) {
        throw new Error(`Erreur ${res.status}: ${res.statusText}`);
      }

      const updatedTicket = await res.json();
      setTicket(prev => ({ ...prev, ...updatedTicket }));
      lastStatusRef.current = updatedTicket.status;
      
      // Mettre à jour localStorage
      localStorage.setItem("lineup_ticket", JSON.stringify({
        ...updatedTicket,
        isAnonymous: ticket.isAnonymous,
        sessionId: ticket.sessionId
      }));

      showSuccess("Ticket repris avec succès !", 4000, true);
      startMonitoring(); // Reprendre la surveillance

    } catch (error) {
      console.error("Erreur lors de la reprise:", error);
      showError("Impossible de reprendre le ticket. Veuillez réessayer.", 5000, true);
      startMonitoring(); // Reprendre la surveillance en cas d'échec
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
        return null;
    }
  };

  return (
    <Layout>
      <AnimatedPage>
        <div className="text-center max-w-2xl mx-auto px-4">
          <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-lg border border-blue-100 p-6 sm:p-8">
            <div className="relative mb-6">
              <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-blue-500 rounded-full p-4 shadow-lg">
                <div className="text-4xl sm:text-5xl">🎫</div>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mt-8 mb-4">
              Ticket n°{ticket.number}
            </h1>

            {/* Affichage du statut */}
            <div className="mb-8">
              <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${ticket.status === "en_attente" ? "bg-gradient-to-r from-yellow-400 to-yellow-300 text-yellow-900" :
                ticket.status === "en_consultation" ? "bg-gradient-to-r from-green-400 to-green-300 text-green-900" :
                  ticket.status === "termine" ? "bg-gradient-to-r from-gray-200 to-gray-100 text-gray-800" :
                    "bg-gradient-to-r from-red-400 to-red-300 text-red-900"
                } shadow-sm`}>
                {getStatusDisplay()}
              </span>
            </div>

            {/* Conseil */}
            <div className="relative mb-8">
              <div className="bg-yellow-300 rounded-[32px] p-1">
                <div className="bg-white rounded-[28px] p-4">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-xl">💡</span>
                    <p className="text-blue-700 text-sm sm:text-base font-medium">
                      <span className="text-blue-800 font-semibold">Conseil :</span> Surveillez la file d'attente pour connaître votre position.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <QRCodeTicket ticketNumber={ticket.number} />

              {ticket.status === "en_attente" && (
                <button
                  onClick={handleCancelRequest}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-red-600 to-red-500 text-white px-6 py-3 rounded-xl hover:from-red-700 hover:to-red-600 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 font-medium shadow-sm"
                >
                  ❌ Annuler mon ticket
                </button>
              )}

              {ticket.status === "desiste" && (
                <button
                  onClick={handleResumeTicket}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-green-600 to-green-500 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-green-600 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 font-medium shadow-sm"
                >
                  🔄 Reprendre mon ticket
                </button>
              )}

              <button
                onClick={() => navigate("/queue")}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-600 transition-all transform hover:scale-[1.02] font-medium shadow-sm"
              >
                📋 Voir la file d'attente
              </button>
            </div>
          </div>

          {/* Modal et Toasts */}
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
