import { useEffect, useState, useRef, useCallback } from "react";
import Layout from "../components/Layout";
import AnimatedPage from "../components/AnimatedPage";

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

  // ⏱️ Mise à jour du temps en temps réel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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
        const statusChanges = data.filter((ticket, index) => {
          const prevTicket = prevQueue[index];
          return prevTicket && prevTicket.status !== ticket.status;
        });

        // Notifications pour les changements importants
        statusChanges.forEach(ticket => {
          if (ticket._id === myId) {
            switch (ticket.status) {
              case "en_consultation":
                playNotificationSound();
                showNotification("C'est votre tour !");
                break;
              case "termine":
                showNotification("Votre consultation est terminée");
                break;
              case "desiste":
                showNotification("Votre ticket a été annulé");
                break;
            }
          }
        });

        setQueue(data);
        lastQueueState.current = data;
        
        // Mettre à jour les estimations uniquement si nécessaire
        if (data.length !== estimations.length) {
          setEstimations(data.map(() => generateRandomEstimation(10, 20)));
        }
      }

      setError(null);
    } catch (err) {
      console.error("Erreur lors de la récupération de la file:", err);
      setError("Impossible de charger la file d'attente");
    }
  }, [estimations.length, myId]);

  // Fonction de notification sonore
  const playNotificationSound = useCallback(() => {
    const audio = new Audio("/notify.mp3");
    audio.play().catch(() => {});
    if ("vibrate" in navigator) {
      navigator.vibrate([300, 100, 300]);
    }
  }, []);

  // Fonction de notification visuelle
  const showNotification = useCallback((message) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("LineUp", { body: message });
    }
  }, []);

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

    // Mise à jour toutes les secondes
    const interval = setInterval(fetchQueue, 1000);
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
        {queue.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Aucun patient dans la file d'attente</p>
          </div>
        ) : (
          <ul className="space-y-2 sm:space-y-3 w-full overflow-x-hidden px-2 sm:px-0">
            {queue.map((t, index) => {
              const estimationMin = estimations[index] || 15;
              const remainingMs = getCumulativeDelay(index);
              const targetTime = new Date(t.createdAt).getTime() + remainingMs;
              const timeLeftMs = targetTime - currentTime;

              const isUserTurn = t._id === myId && timeLeftMs <= 0;

              // ✅ Alerte son + vibration une seule fois
              if (isUserTurn && !hasAlerted.current) {
                hasAlerted.current = true;
                const audio = new Audio("/notify.mp3");
                audio.play().catch(() => {});
                if ("vibrate" in navigator) {
                  navigator.vibrate([300, 100, 300]);
                }
              }

              const minutes = Math.floor(timeLeftMs / 60000);
              const seconds = Math.floor((timeLeftMs % 60000) / 1000);
              const displayTime = isUserTurn ? (
                <span className="animate-blink font-semibold text-black text-sm sm:text-base">
                  À vous bientôt
                </span>
              ) : (
                `${minutes} min ${seconds.toString().padStart(2, "0")} s`
              );

              let statusDisplay;
              if (t.status === "desiste") {
                statusDisplay = (
                  <span className="inline-block bg-red-100 text-red-700 text-xs font-semibold px-2 py-1 rounded-full">
                    Désisté
                  </span>
                );
              } else if (index === 0) {
                statusDisplay = (
                  <span className="inline-block bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full animate-pulse">
                    En consultation
                  </span>
                );
              } else {
                statusDisplay = (
                  <span className="inline-block bg-yellow-100 text-yellow-700 text-xs font-semibold px-2 py-1 rounded-full">
                    En attente
                  </span>
                );
              }

              return (
                <li
                  key={t._id}
                  className={`p-3 sm:p-4 rounded-lg shadow-sm ${
                    t._id === myId ? "bg-yellow-100 font-semibold" : "bg-white"
                  } transition-all duration-300 ease-in-out`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                    <div className="flex items-center gap-2 text-sm sm:text-base">
                      🎫 {t.number} • {statusDisplay}{" "}
                      {t._id === myId && <span className="text-black font-semibold">(vous)</span>}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-500">
                      ⏳ {displayTime}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {/* Bouton admin discret en bas à droite */}
        <div className="fixed bottom-16 sm:bottom-20 right-4 z-50">
          <a
            href="/admin-login"
            className="bg-blue-600 text-white text-xs px-3 py-2 rounded-full shadow hover:bg-blue-700 transition"
            title="Connexion admin"
          >
            Admin
          </a>
        </div>
      </AnimatedPage>
    </Layout>
  );
}
