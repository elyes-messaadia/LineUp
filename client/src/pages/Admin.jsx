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
    const res = await fetch("http://localhost:5000/queue");
    const data = await res.json();
    setQueue(data);
  };

  const handleCallNext = async () => {
    await fetch("http://localhost:5000/next", {
      method: "DELETE",
    });
    fetchQueue();
  };

  const handleResetQueue = async () => {
    const confirm = window.confirm("Voulez-vous vraiment réinitialiser la file ?");
    if (!confirm) return;

    await fetch("http://localhost:5000/reset", {
      method: "DELETE",
    });

    alert("File d’attente réinitialisée.");
    fetchQueue();
  };

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

        {/* ✅ Bouton Réinitialiser */}
        <button
          onClick={handleResetQueue}
          className="mb-6 w-full bg-red-600 text-white py-2 rounded hover:bg-red-700"
        >
          🗑️ Réinitialiser la file
        </button>

        <ul className="space-y-2">
          {queue.map((t) => (
            <li
              key={t.id}
              className={`p-3 rounded border ${
                t.status === "en_consultation"
                  ? "bg-blue-100 border-blue-400"
                  : t.status === "desiste"
                  ? "bg-red-100 border-red-400 line-through italic"
                  : "bg-white"
              }`}
            >
              🎫 {t.number} • {t.status.replace("_", " ")}
            </li>
          ))}
        </ul>
      </AnimatedPage>
    </Layout>
  );
}
