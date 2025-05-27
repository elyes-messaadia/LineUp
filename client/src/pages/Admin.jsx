import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import AnimatedPage from "../components/AnimatedPage";

export default function Admin() {
  const navigate = useNavigate();
  const [queue, setQueue] = useState([]);

  useEffect(() => {
    const isAdmin = localStorage.getItem("isAdmin");
    if (isAdmin !== "true") {
      navigate("/admin-login");
    }

    fetchQueue();
    const interval = setInterval(fetchQueue, 3000);
    return () => clearInterval(interval);
  }, [navigate]);

  const fetchQueue = async () => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/queue`);
    const data = await res.json();
    setQueue(data);
  };

  const handleCallNext = async () => {
    await fetch(`${import.meta.env.VITE_API_URL}/next`, {
      method: "DELETE",
    });
    fetchQueue();
  };

  const handleResetQueue = async () => {
    const confirm = window.confirm("Voulez-vous vraiment réinitialiser la file ?");
    if (!confirm) return;

    await fetch(`${import.meta.env.VITE_API_URL}/reset`, {
      method: "DELETE",
    });

    alert("File d’attente réinitialisée.");
    fetchQueue();
  };

  const handleFinish = async (id) => {
    await fetch(`${import.meta.env.VITE_API_URL}/ticket/${id}/finish`, {
      method: "PATCH",
    });
    fetchQueue();
  };

  // 🎯 Tri des statuts
  const sortedQueue = [...queue].sort((a, b) => {
    const order = {
      en_attente: 1,
      en_consultation: 2,
      desiste: 3,
      termine: 4,
    };
    return order[a.status] - order[b.status];
  });

  return (
    <Layout>
      <AnimatedPage>
        <h1 className="text-2xl font-bold mb-4 text-blue-700 text-center">
          Tableau de bord médecin
        </h1>

        <button
          onClick={() => {
            localStorage.removeItem("isAdmin");
            navigate("/admin-login");
          }}
          className="mb-4 text-sm text-red-600 underline hover:text-red-800"
        >
          🔒 Se déconnecter
        </button>

        <button
          onClick={handleCallNext}
          className="mb-4 w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
        >
          ✅ Appeler le suivant
        </button>

        <button
          onClick={handleResetQueue}
          className="mb-6 w-full bg-red-600 text-white py-2 rounded hover:bg-red-700"
        >
          🗑️ Réinitialiser la file
        </button>

        <ul className="space-y-2">
          {sortedQueue.map((t) => {
            let badge;
            if (t.status === "en_attente") {
              badge = (
                <span className="inline-block bg-yellow-100 text-yellow-700 text-xs font-semibold px-2 py-1 rounded-full">
                  En attente
                </span>
              );
            } else if (t.status === "en_consultation") {
              badge = (
                <span className="inline-block bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full animate-pulse">
                  En consultation
                </span>
              );
            } else if (t.status === "desiste") {
              badge = (
                <span className="inline-block bg-red-100 text-red-700 text-xs font-semibold px-2 py-1 rounded-full">
                  Désisté
                </span>
              );
            } else if (t.status === "termine") {
              badge = (
                <span className="inline-block bg-gray-200 text-gray-700 text-xs font-semibold px-2 py-1 rounded-full">
                  Terminé
                </span>
              );
            }

            return (
              <li
                key={t.id}
                className={`p-3 rounded border flex justify-between items-center ${
                  t.status === "desiste"
                    ? "line-through italic bg-red-50 border-red-300"
                    : t.status === "termine"
                    ? "bg-gray-100 border-gray-400 text-gray-600"
                    : "bg-white"
                }`}
              >
                <span>
                  🎫 {t.number} • {badge}
                </span>

                {t.status === "en_consultation" && (
                  <button
                    onClick={() => handleFinish(t.id)}
                    className="text-xs bg-gray-300 hover:bg-gray-400 text-black px-2 py-1 rounded ml-2"
                  >
                    Terminer
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </AnimatedPage>
    </Layout>
  );
}
