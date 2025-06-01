import { useEffect, useState, useRef, useCallback } from "react";
import Layout from "../components/Layout";
import AnimatedPage from "../components/AnimatedPage";
import Toast from "../components/Toast";
import { useToast } from "../hooks/useToast";

// Constantes
const API_URL = import.meta.env.VITE_API_URL;
const POLL_INTERVAL = 2000;
const DOCTEURS = ['Docteur 1', 'Docteur 2', 'Docteur 3'];

// Utilitaires
const formatWaitingTime = (minutes, seconds) => {
  if (minutes < 0 || seconds < 0) return "Bientôt votre tour";
  if (minutes === 0) return `${seconds} secondes`;
  if (minutes === 1) return "1 minute";
  return `${minutes} minutes`;
};

// Hook personnalisé pour la gestion des notifications
const useNotifications = () => {
  const playNotificationSound = useCallback(() => {
    try {
      const audio = new Audio("/notify.mp3");
      audio.volume = 1.0;
      audio.play().catch(console.warn);
    } catch (error) {
      console.warn('Erreur audio:', error);
    }
  }, []);

  const showSystemNotification = useCallback((title, body) => {
    if (!("Notification" in window)) return;
    
    const showNotif = () => {
      new Notification(title, {
        body,
        icon: "/icon-192x192.png",
        badge: "/icon-192x192.png",
        vibrate: [300, 100, 300]
      });
    };

    if (Notification.permission === "granted") {
      showNotif();
    } else if (Notification.permission === "default") {
      Notification.requestPermission().then(permission => {
        if (permission === "granted") showNotif();
      });
    }
  }, []);

  return { playNotificationSound, showSystemNotification };
};

// Composant pour la file d'attente d'un docteur
const DoctorQueue = React.memo(({ tickets, currentTime, myId, onNotification }) => {
  const stats = {
    waiting: tickets.filter(t => t.status === "en_attente").length,
    inConsultation: tickets.filter(t => t.status === "en_consultation").length,
    finished: tickets.filter(t => t.status === "termine").length
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
          <h3 className="text-blue-800 font-semibold mb-1">En attente</h3>
          <p className="text-2xl font-bold text-blue-600">{stats.waiting}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-xl border border-green-100">
          <h3 className="text-green-800 font-semibold mb-1">En consultation</h3>
          <p className="text-2xl font-bold text-green-600">{stats.inConsultation}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
          <h3 className="text-purple-800 font-semibold mb-1">Terminés</h3>
          <p className="text-2xl font-bold text-purple-600">{stats.finished}</p>
        </div>
      </div>

      {tickets.map((ticket) => {
        const isMyTicket = ticket._id === myId;
        let cardStyle = "";
        let statusBadge = "";
        let timeDisplay = "";

        switch (ticket.status) {
          case "en_consultation":
            cardStyle = "bg-green-50 border-green-200";
            statusBadge = "bg-green-100 text-green-700";
            timeDisplay = "En consultation";
            break;
          case "termine":
            cardStyle = "bg-gray-50 border-gray-200";
            statusBadge = "bg-gray-100 text-gray-700";
            timeDisplay = "Terminé";
            break;
          case "desiste":
            cardStyle = "bg-red-50 border-red-200";
            statusBadge = "bg-red-100 text-red-700";
            timeDisplay = "Désisté";
            break;
          default:
            cardStyle = isMyTicket ? "bg-yellow-50 border-yellow-200" : "bg-white border-gray-200";
            statusBadge = "bg-blue-100 text-blue-700";
            const position = tickets.filter(t => t.status === "en_attente").findIndex(t => t._id === ticket._id) + 1;
            timeDisplay = `Position ${position}`;
        }

        return (
          <div
            key={ticket._id}
            className={`p-4 rounded-xl border ${cardStyle} ${isMyTicket ? "shadow-md" : "shadow-sm"} mb-3`}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="text-xl">🎫</span>
                <span className="font-semibold">N°{ticket.number}</span>
                {isMyTicket && (
                  <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded-full">
                    Vous
                  </span>
                )}
                <span className={`text-xs px-2 py-1 rounded-full ${statusBadge}`}>
                  {timeDisplay}
                </span>
              </div>
              <div className="text-sm text-gray-500">
                {new Date(ticket.createdAt).toLocaleTimeString()}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
});

// Composant principal
const Queue = () => {
  const [state, setState] = useState({
    queues: Object.fromEntries(DOCTEURS.map(d => [d, []])),
    myId: null,
    currentTime: Date.now(),
    isLoading: true,
    error: null,
    selectedDoctor: null
  });

  const refs = {
    pollInterval: useRef(null),
    retryCount: useRef(0),
    timeInterval: useRef(null)
  };

  const toast = useToast();
  const { playNotificationSound, showSystemNotification } = useNotifications();
  const isSecretary = true; // À remplacer par la vraie logique d'authentification

  const fetchQueues = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/queue`);
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const tickets = await res.json();

      // Grouper les tickets par docteur
      const queuesByDoctor = DOCTEURS.reduce((acc, docteur) => {
        acc[docteur] = tickets.filter(t => t.docteur === docteur);
        return acc;
      }, {});

      setState(prev => ({
        ...prev,
        queues: queuesByDoctor,
        error: null
      }));

      refs.retryCount.current = 0;
    } catch (err) {
      console.error("Erreur file d'attente:", err);
      refs.retryCount.current++;
      
      if (refs.retryCount.current <= 3) {
        setState(prev => ({
          ...prev,
          error: `Tentative de reconnexion... (${refs.retryCount.current}/3)`
        }));
        // Utiliser setTimeout au lieu de rappel récursif direct
        setTimeout(() => {
          fetchQueues();
        }, 1000 * refs.retryCount.current);
      } else {
        setState(prev => ({
          ...prev,
          error: "Impossible de charger les files d'attente. Veuillez rafraîchir la page."
        }));
        // Ne pas utiliser toast dans le fetchQueues pour éviter les dépendances cycliques
        console.error("Erreur de connexion au serveur. Veuillez rafraîchir la page.");
      }
    }
  }, [API_URL]);

  useEffect(() => {
    // Initialisation
    const storedTicket = localStorage.getItem("lineup_ticket");
    if (storedTicket) {
      try {
        const parsed = JSON.parse(storedTicket);
        setState(prev => ({
          ...prev,
          myId: parsed.userId || parsed.sessionId
        }));
      } catch (e) {
        console.error("Erreur ticket:", e);
        localStorage.removeItem("lineup_ticket");
      }
    }

    // Premier fetch
    fetchQueues();
    setState(prev => ({ ...prev, isLoading: false }));

    // Polling
    refs.pollInterval.current = setInterval(fetchQueues, POLL_INTERVAL);
    
    // Timer pour l'heure actuelle
    refs.timeInterval.current = setInterval(() => {
      setState(prev => ({ ...prev, currentTime: Date.now() }));
    }, 1000);
    
    return () => {
      if (refs.pollInterval.current) {
        clearInterval(refs.pollInterval.current);
      }
      if (refs.timeInterval.current) {
        clearInterval(refs.timeInterval.current);
      }
    };
  }, [fetchQueues]); // Utiliser fetchQueues comme dépendance

  if (state.isLoading) {
    return (
      <Layout>
        <AnimatedPage>
          <div className="flex justify-center items-center min-h-[200px]">
            <div className="animate-spin text-4xl">⏳</div>
          </div>
        </AnimatedPage>
      </Layout>
    );
  }

  if (state.error) {
    return (
      <Layout>
        <AnimatedPage>
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Erreur!</strong>
            <span className="block sm:inline"> {state.error}</span>
          </div>
        </AnimatedPage>
      </Layout>
    );
  }

  return (
    <Layout>
      <AnimatedPage>
        <div className="max-w-7xl mx-auto px-4">
          {isSecretary && (
            <div className="mb-8">
              <div className="flex gap-4">
                {DOCTEURS.map(docteur => (
                  <button
                    key={docteur}
                    onClick={() => setState(prev => ({ ...prev, selectedDoctor: docteur }))}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      state.selectedDoctor === docteur
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    {docteur}
                  </button>
                ))}
                {state.selectedDoctor && (
                  <button
                    onClick={() => setState(prev => ({ ...prev, selectedDoctor: null }))}
                    className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700"
                  >
                    Voir tout
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {(state.selectedDoctor ? [state.selectedDoctor] : DOCTEURS).map(docteur => (
              <div key={docteur} className="col-span-1">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">{docteur}</h2>
                <DoctorQueue
                  tickets={state.queues[docteur] || []}
                  currentTime={state.currentTime}
                  myId={state.myId}
                  onNotification={toast.showSuccess}
                />
              </div>
            ))}
          </div>

          {toast.toasts && toast.toasts.map((t) => (
            <Toast
              key={t.id}
              message={t.message}
              type={t.type}
              duration={t.duration}
              onClose={() => toast.removeToast(t.id)}
            />
          ))}
        </div>
      </AnimatedPage>
    </Layout>
  );
};

export default Queue;
