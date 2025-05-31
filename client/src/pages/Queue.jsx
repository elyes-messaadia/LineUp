import { useEffect, useState, useRef } from "react";
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
  const hasAlerted = useRef(false); // 🔔 pour bloquer les alertes répétées

  // ⏱️ Mise à jour du temps en temps réel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // 📥 Récupération du ticket + file d'attente depuis le back
  useEffect(() => {
    const ticket = localStorage.getItem("lineup_ticket");
    if (ticket) {
      const parsed = JSON.parse(ticket);
      setMyId(parsed._id);
    }

    const fetchQueue = async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/queue`);
      const data = await res.json();
      setQueue(data);
      setEstimations(data.map(() => generateRandomEstimation(10, 20)));
    };

    fetchQueue();
    const interval = setInterval(fetchQueue, 3000);
    return () => clearInterval(interval);
  }, []);

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

  return (
    <Layout>
      <AnimatedPage>
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
                }`}
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
