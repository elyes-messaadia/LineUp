import { useEffect, useState, useRef, useCallback } from "react";
import Layout from "../components/Layout";
import AnimatedPage from "../components/AnimatedPage";
import Toast from "../components/Toast";
import { useToast } from "../hooks/useToast";

// Constantes
const API_URL = import.meta.env.VITE_API_URL;
const POLL_INTERVAL = 2000;

// Utilitaires
const generateRandomEstimation = (min = 10, max = 20) => 
  Math.floor(Math.random() * (max - min + 1)) + min;

const Queue = () => {
  // États
  const [queue, setQueue] = useState([]);
  const [myId, setMyId] = useState(null);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [estimations, setEstimations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Refs
  const hasAlerted = useRef(false);
  const lastQueueState = useRef([]);
  const nextInLineAlerted = useRef(false);
  const pollInterval = useRef(null);
  const retryCount = useRef(0);
  const maxRetries = 3;

  // Hooks
  const { toasts, showSuccess, showWarning, showError, showInfo, removeToast } = useToast();

  // Fonctions
  const playNotificationSound = useCallback(() => {
    try {
      const audio = new Audio("/notify.mp3");
      audio.volume = 1.0;
      audio.play().catch(() => {
        document.addEventListener('click', () => {
          audio.play().catch(() => {});
        }, { once: true });
      });
      
      if ("vibrate" in navigator) {
        navigator.vibrate([300, 100, 300, 100, 300]);
      }
    } catch (error) {
      console.warn('Erreur lecture audio:', error);
    }
  }, []);

  const sendSystemNotification = useCallback((title, body) => {
    if (!("Notification" in window)) return;
    
    const showNotification = () => {
      new Notification(title, {
        body,
        icon: "/icon-192x192.png",
        badge: "/icon-192x192.png",
        vibrate: [300, 100, 300, 100, 300],
        requireInteraction: true
      });
    };

    if (Notification.permission === "granted") {
      showNotification();
    } else if (Notification.permission === "default") {
      Notification.requestPermission().then(permission => {
        if (permission === "granted") showNotification();
      });
    }
  }, []);

  const checkNextInLine = useCallback((currentQueue) => {
    if (!myId || !currentQueue?.length) return;

    const currentPatientIndex = currentQueue.findIndex(t => t.status === "en_consultation");
    
    if (currentPatientIndex !== -1) {
      const nextPatient = currentQueue.find((t, index) => 
        index > currentPatientIndex && t.status === "en_attente"
      );

      if (nextPatient && 
          (nextPatient._id === myId || nextPatient.sessionId === myId) && 
          !nextInLineAlerted.current) {
        playNotificationSound();
        showWarning("⏰ Préparez-vous ! Vous serez le prochain patient", 10000);
        nextInLineAlerted.current = true;
      }
    } else {
      const firstInLine = currentQueue.find(t => t.status === "en_attente");
      if (firstInLine && 
          (firstInLine._id === myId || firstInLine.sessionId === myId) && 
          !nextInLineAlerted.current) {
        playNotificationSound();
        showSuccess("🏥 Préparez-vous ! Vous allez être appelé", 10000);
        nextInLineAlerted.current = true;
      }
    }
  }, [myId, playNotificationSound, showWarning, showSuccess]);

  // 🔄 Fonction de récupération de la file d'attente
  const fetchQueue = useCallback(async () => {
    if (!API_URL) {
      console.error("❌ VITE_API_URL n'est pas défini");
      setError("Erreur de configuration : URL de l'API manquante");
      return;
    }

    try {
      console.log('📡 Tentative de connexion à:', API_URL);
      const res = await fetch(`${API_URL}/queue`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      if (!res.ok) {
        throw new Error(`Erreur ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      console.log('✅ Données reçues:', { count: data.length });
      retryCount.current = 0;

      // Toujours mettre à jour l'état avec les nouvelles données
      setQueue(data);

      // Comparer avec l'état précédent pour détecter les changements
      const prevQueue = lastQueueState.current;
      const hasChanges = JSON.stringify(data) !== JSON.stringify(prevQueue);

      if (hasChanges) {
        // Mettre à jour les estimations si nécessaire
        const needsNewEstimations = data.some((ticket, index) => {
          const prevTicket = prevQueue[index];
          return !prevTicket || prevTicket.status !== ticket.status;
        });

        if (needsNewEstimations) {
          setEstimations(data.map(() => generateRandomEstimation(10, 20)));
        }

        // Vérifier les changements de statut
        if (prevQueue.length > 0) {
          data.forEach((ticket) => {
            const prevTicket = prevQueue.find(t => 
              t._id === ticket._id || 
              (t.sessionId && t.sessionId === ticket.sessionId)
            );
            
            if (prevTicket && prevTicket.status !== ticket.status) {
              // Vérifier si c'est mon ticket (connecté ou anonyme)
              const isMyTicket = ticket._id === myId || ticket.sessionId === myId;

              // Notification pour changement de statut
              switch (ticket.status) {
                case "en_consultation":
                  if (isMyTicket) {
                    playNotificationSound();
                    setTimeout(playNotificationSound, 1500);
                    showSuccess("🏥 C'est votre tour ! Veuillez vous présenter au cabinet", 15000);
                    sendSystemNotification(
                      "🏥 C'est votre tour !",
                      "Veuillez vous présenter immédiatement au cabinet médical"
                    );
                  } else {
                    playNotificationSound();
                    showWarning(`Le patient n°${ticket.number} est appelé en consultation`, 8000);
                  }
                  break;
                  
                case "termine":
                  if (isMyTicket) {
                    playNotificationSound();
                    showSuccess("✅ Votre consultation est terminée", 8000);
                    sendSystemNotification(
                      "✅ Consultation terminée",
                      "Merci de votre visite ! N'oubliez pas vos documents."
                    );
                    localStorage.removeItem("lineup_ticket");
                  } else {
                    showInfo(`La consultation du patient n°${ticket.number} est terminée`, 5000);
                    const nextPatient = data.find(t => t.status === "en_attente");
                    if (nextPatient && (nextPatient._id === myId || nextPatient.sessionId === myId)) {
                      playNotificationSound();
                      showSuccess("🏥 Préparez-vous ! Vous serez le prochain", 10000);
                      sendSystemNotification(
                        "🏥 Préparez-vous !",
                        "Vous serez le prochain patient à être appelé"
                      );
                    }
                  }
                  break;
                  
                case "desiste":
                  if (isMyTicket) {
                    playNotificationSound();
                    showError("❌ Votre ticket a été annulé", 8000);
                    localStorage.removeItem("lineup_ticket");
                  }
                  break;
              }
              
              // Reset les alertes après un changement de statut
              if (isMyTicket) {
                nextInLineAlerted.current = false;
                hasAlerted.current = false;
              }
            }
          });
        }

        // Vérifier si je suis le prochain
        checkNextInLine(data);
      }

      // Toujours mettre à jour l'état précédent
      lastQueueState.current = data;
      setError(null);
    } catch (err) {
      console.error("❌ Erreur lors de la récupération de la file:", err);
      retryCount.current++;
      
      if (retryCount.current <= maxRetries) {
        const message = `Tentative de reconnexion... (${retryCount.current}/${maxRetries})`;
        console.log('🔄', message);
        setError(message);
        setTimeout(fetchQueue, 1000 * retryCount.current);
      } else {
        const message = "Impossible de charger la file d'attente. Veuillez rafraîchir la page.";
        console.error('❌', message);
        setError(message);
        showError("Erreur de connexion au serveur. Veuillez rafraîchir la page.", 0);
      }
    }
  }, [myId, showSuccess, showWarning, showError, showInfo, checkNextInLine, sendSystemNotification]);

  // ⏱️ Mise à jour du temps en temps réel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // 📥 Initialisation et mise à jour périodique
  useEffect(() => {
    // Récupérer l'ID du ticket depuis le localStorage
    const storedTicket = localStorage.getItem("lineup_ticket");
    if (storedTicket) {
      try {
        const parsed = JSON.parse(storedTicket);
        setMyId(parsed.userId || parsed.sessionId);
      } catch (e) {
        console.error("Erreur parsing ticket:", e);
        localStorage.removeItem("lineup_ticket");
      }
    }

    // Demander la permission pour les notifications dès le chargement
    if ("Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
      else if (Notification.permission === "denied") {
        showWarning("Activez les notifications pour être alerté quand c'est votre tour", 10000);
      }
    }

    // Premier chargement
    fetchQueue();
    setIsLoading(false);

    // Mise à jour toutes les 2 secondes pour un meilleur équilibre
    pollInterval.current = setInterval(fetchQueue, 2000);
    
    return () => {
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
      }
    };
  }, [fetchQueue, showWarning]);

  // Reset l'alerte si la queue change
  useEffect(() => {
    hasAlerted.current = false;
  }, [queue]);

  // ✅ Calcule une estimation réaliste en cumulant uniquement les tickets valides
  const getCumulativeDelay = (index) => {
    let total = 0;
    for (let i = 0; i < index; i++) {
      const t = queue[i];
      const estimation = estimations[i] || 15;
      if (t.status !== "desiste") {
        total += estimation;
      }
    }
    return total * 60 * 1000; // converti en ms
  };

  // Fonction pour formater le temps d'attente
  const formatWaitingTime = (minutes, seconds) => {
    if (minutes < 0 || seconds < 0) return "Bientôt votre tour";
    if (minutes === 0) return `${seconds} secondes`;
    if (minutes === 1) return "1 minute";
    return `${minutes} minutes`;
  };

  if (isLoading) {
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

  if (error) {
    return (
      <Layout>
        <AnimatedPage>
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Erreur!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        </AnimatedPage>
      </Layout>
    );
  }

  return (
    <Layout>
      <AnimatedPage>
        <div className="max-w-4xl mx-auto px-4">
          {/* En-tête avec statistiques */}
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
              <h3 className="text-blue-800 font-semibold mb-1">En attente</h3>
              <p className="text-2xl font-bold text-blue-600">
                {queue.filter(t => t.status === "en_attente").length}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-xl border border-green-100">
              <h3 className="text-green-800 font-semibold mb-1">En consultation</h3>
              <p className="text-2xl font-bold text-green-600">
                {queue.filter(t => t.status === "en_consultation").length}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
              <h3 className="text-purple-800 font-semibold mb-1">Terminés</h3>
              <p className="text-2xl font-bold text-purple-600">
                {queue.filter(t => t.status === "termine").length}
              </p>
            </div>
          </div>

          {/* Patient en cours */}
          {queue.find(t => t.status === "en_consultation") && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4">
              <h2 className="text-green-800 font-semibold mb-2 flex items-center gap-2">
                <span className="text-xl">🩺</span>
                En consultation
              </h2>
              <div className="flex items-center justify-between">
                <p className="text-green-700">
                  Patient n°{queue.find(t => t.status === "en_consultation").number}
                </p>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  <span className="text-sm text-green-600">En cours</span>
                </div>
              </div>
            </div>
          )}

          {/* File d'attente */}
          {queue.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
              <div className="text-4xl mb-3">🎯</div>
              <p className="text-gray-600">Aucun patient dans la file d'attente</p>
            </div>
          ) : (
            <div className="space-y-3">
              {queue.map((t, index) => {
                const remainingMs = getCumulativeDelay(index);
                const targetTime = new Date(t.createdAt).getTime() + remainingMs;
                const timeLeftMs = targetTime - currentTime;
                const minutes = Math.floor(timeLeftMs / 60000);
                const seconds = Math.floor((timeLeftMs % 60000) / 1000);

                // Déterminer le style en fonction du statut
                let cardStyle = "";
                let statusBadge = "";
                let timeDisplay = "";

                switch (t.status) {
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
                    cardStyle = t._id === myId ? "bg-yellow-50 border-yellow-200" : "bg-white border-gray-200";
                    statusBadge = "bg-blue-100 text-blue-700";
                    timeDisplay = formatWaitingTime(minutes, seconds);
                }

                // Alerte sonore pour le patient actuel
                const isUserTurn = t._id === myId && timeLeftMs <= 0 && t.status === "en_attente";
                if (isUserTurn && !hasAlerted.current) {
                  hasAlerted.current = true;
                  playNotificationSound();
                }

                return (
                  <div
                    key={t._id}
                    className={`p-4 rounded-xl border transition-all duration-300 ${cardStyle} ${
                      t._id === myId ? "shadow-md" : "shadow-sm"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">🎫</span>
                          <span className="font-semibold">N°{t.number}</span>
                          {t._id === myId && (
                            <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded-full">
                              Vous
                            </span>
                          )}
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${statusBadge}`}>
                          {t.status === "en_attente" ? `Position ${
                            queue.filter(qt => qt.status === "en_attente").findIndex(qt => qt._id === t._id) + 1
                          }` : timeDisplay}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3 text-sm">
                        <div className="text-gray-500">
                          Arrivée : {new Date(t.createdAt).toLocaleTimeString()}
                        </div>
                        {t.status === "en_attente" && (
                          <div className={`flex items-center gap-2 ${
                            minutes <= 5 ? "text-orange-600" : "text-blue-600"
                          }`}>
                            <span className="w-2 h-2 rounded-full animate-pulse bg-current"></span>
                            {timeDisplay}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Notifications Toast */}
          {toasts.map((toast) => (
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

export default Queue;
