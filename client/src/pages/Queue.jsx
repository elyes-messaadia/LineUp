import { useEffect, useState, useRef, useCallback } from "react";
import Layout from "../components/Layout";
import AnimatedPage from "../components/AnimatedPage";
import Toast from "../components/Toast";
import { useToast } from "../hooks/useToast";

// Génère une estimation aléatoire en minutes (entre 10 et 20 par défaut)
function generateRandomEstimation(min = 10, max = 20) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export default function Queue() {
  const [queue, setQueue] = useState([]);
  const [myId, setMyId] = useState(null);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [estimations, setEstimations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const hasAlerted = useRef(false);
  const lastQueueState = useRef([]);
  const nextInLineAlerted = useRef(false);
  const { toasts, showSuccess, showWarning, showError, removeToast } = useToast();

  // ⏱️ Mise à jour du temps en temps réel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fonction de notification sonore
  const playNotificationSound = useCallback(() => {
    const audio = new Audio("/notify.mp3");
    audio.volume = 1.0; // Volume maximum
    audio.play().catch(() => {});
    
    // Vibration
    if ("vibrate" in navigator) {
      navigator.vibrate([300, 100, 300]);
    }
  }, []);

  // Fonction pour vérifier si un patient est le prochain
  const checkNextInLine = useCallback((currentQueue) => {
    if (!myId || currentQueue.length < 2) return;

    // Trouver l'index du patient actuel
    const currentPatientIndex = currentQueue.findIndex(t => t.status === "en_consultation");
    
    // Si un patient est en consultation
    if (currentPatientIndex !== -1) {
      // Trouver le prochain patient en attente
      const nextPatient = currentQueue.find((t, index) => 
        index > currentPatientIndex && t.status === "en_attente"
      );

      // Si c'est moi le prochain et que je n'ai pas encore été alerté
      if (nextPatient && nextPatient._id === myId && !nextInLineAlerted.current) {
        playNotificationSound();
        showWarning("⏰ Préparez-vous ! Vous serez le prochain patient", 10000);
        nextInLineAlerted.current = true;
      }
    } else {
      // Si personne n'est en consultation, vérifier si je suis le premier en attente
      const firstInLine = currentQueue.find(t => t.status === "en_attente");
      if (firstInLine && firstInLine._id === myId && !nextInLineAlerted.current) {
        playNotificationSound();
        showSuccess("🏥 Préparez-vous ! Vous allez être appelé", 10000);
        nextInLineAlerted.current = true;
      }
    }
  }, [myId, playNotificationSound, showWarning, showSuccess]);

  // 🔄 Fonction de récupération de la file d'attente
  const fetchQueue = useCallback(async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/queue`);
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();

      // Comparer avec l'état précédent pour détecter les changements
      const prevQueue = lastQueueState.current;
      const hasChanges = JSON.stringify(data) !== JSON.stringify(prevQueue);

      if (hasChanges) {
        // Vérifier les changements de statut
        data.forEach((ticket) => {
          const prevTicket = prevQueue.find(t => t._id === ticket._id);
          
          if (prevTicket && prevTicket.status !== ticket.status) {
            // Notification pour changement de statut
            switch (ticket.status) {
              case "en_consultation":
                if (ticket._id === myId) {
                  playNotificationSound();
                  showSuccess("🏥 C'est votre tour ! Veuillez vous présenter au cabinet", 10000);
                  
                  // Notification système
                  if ("Notification" in window && Notification.permission === "granted") {
                    new Notification("C'est votre tour !", {
                      body: "Veuillez vous présenter au cabinet médical",
                      icon: "/icon-192x192.png"
                    });
                  }
                } else {
                  // Notifier les autres patients
                  playNotificationSound();
                  showWarning(`Le patient n°${ticket.number} est appelé en consultation`, 8000);
                }
                break;
                
              case "termine":
                if (ticket._id === myId) {
                  playNotificationSound();
                  showSuccess("✅ Votre consultation est terminée", 8000);
                } else {
                  showInfo(`La consultation du patient n°${ticket.number} est terminée`, 5000);
                  // Vérifier si je suis le prochain
                  const nextPatient = data.find(t => t.status === "en_attente");
                  if (nextPatient && nextPatient._id === myId) {
                    playNotificationSound();
                    showSuccess("🏥 Préparez-vous ! Vous serez le prochain", 10000);
                  }
                }
                break;
                
              case "desiste":
                if (ticket._id === myId) {
                  playNotificationSound();
                  showError("❌ Votre ticket a été annulé", 8000);
                }
                break;
            }
            
            // Reset les alertes après un changement de statut
            if (ticket._id === myId) {
              nextInLineAlerted.current = false;
              hasAlerted.current = false;
            }
          }
        });

        setQueue(data);
        lastQueueState.current = data;
        checkNextInLine(data);
        
        // Mettre à jour les estimations
        if (data.length !== estimations.length) {
          setEstimations(data.map(() => generateRandomEstimation(10, 20)));
        }
      }

      setError(null);
    } catch (err) {
      console.error("Erreur lors de la récupération de la file:", err);
      setError("Impossible de charger la file d'attente");
    }
  }, [estimations.length, myId, playNotificationSound, showSuccess, showWarning, showError, checkNextInLine]);

  // 📥 Initialisation et mise à jour périodique
  useEffect(() => {
    const ticket = localStorage.getItem("lineup_ticket");
    if (ticket) {
      const parsed = JSON.parse(ticket);
      setMyId(parsed._id);
    }

    // Demander la permission pour les notifications
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    // Premier chargement
    fetchQueue();
    setIsLoading(false);

    // Mise à jour toutes les 500ms pour plus de réactivité
    const interval = setInterval(fetchQueue, 500);
    return () => clearInterval(interval);
  }, [fetchQueue]);

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
