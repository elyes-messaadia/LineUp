import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import AnimatedPage from "../components/AnimatedPage";

// Fonction utilitaire pour estimer le temps par patient
function getEstimationPerPatient() {
  const hour = new Date().getHours();
  if (hour < 12) return 5;
  if (hour < 17) return 8;
  return 10;
}

export default function Queue() {
  const [queue, setQueue] = useState([]);
  const [myId, setMyId] = useState(null);
  const [currentTime, setCurrentTime] = useState(Date.now()); // ✅ compteur en temps réel

  // Mise à jour du temps toutes les secondes
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const ticket = localStorage.getItem("lineup_ticket");
    if (ticket) {
      const parsed = JSON.parse(ticket);
      setMyId(parsed.id);
    }

    const fetchQueue = async () => {
      const res = await fetch("http://localhost:5000/queue");
      const data = await res.json();
      setQueue(data);
    };

    fetchQueue();
    const interval = setInterval(fetchQueue, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Layout>
      <AnimatedPage>
        <ul className="space-y-2">
          {queue.map((t, index) => {
            const estimationMin = getEstimationPerPatient();
            const remainingMs = estimationMin * 60 * 1000 * index;
            const targetTime = new Date(t.createdAt).getTime() + remainingMs;
            const timeLeftMs = targetTime - currentTime;

            const minutes = Math.floor(timeLeftMs / 60000);
            const seconds = Math.floor((timeLeftMs % 60000) / 1000);
            const displayTime =
              timeLeftMs > 0
                ? `${minutes} min ${seconds.toString().padStart(2, "0")} s`
                : "À vous bientôt";

            return (
              <li
                key={t.id}
                className={`p-3 rounded-lg shadow-sm ${
                  t.id === myId ? "bg-yellow-100 font-semibold" : "bg-white"
                }`}
              >
                #{t.number} –{" "}
                {t.status === "desiste"
                  ? "Désisté"
                  : index === 0
                  ? "En consultation"
                  : "En attente"}{" "}
                {t.id === myId && "(vous)"}
                <div className="text-sm text-gray-500 mt-1">⏳ {displayTime}</div>
              </li>
            );
          })}
        </ul>

        <div className="mt-10 text-center text-sm text-gray-400">
          Accès personnel médical ?{" "}
          <a href="/admin-login" className="underline hover:text-blue-500">
            Connexion admin
          </a>
        </div>
      </AnimatedPage>
    </Layout>
  );
}
