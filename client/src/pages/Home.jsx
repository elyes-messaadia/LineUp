import { useNavigate } from "react-router-dom"; // Librairie externe
import Layout from "../components/Layout"; // Composant interne
import AnimatedPage from "../components/AnimatedPage"; // Nouveau composant interne

export default function Home() {
  const navigate = useNavigate();

  const handleTicket = async () => {
    const res = await fetch("http://localhost:5000/ticket", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json();
    localStorage.setItem("lineup_ticket", JSON.stringify(data));
    navigate("/ticket");
  };

  return (
    <Layout>
      <AnimatedPage>
        <p className="text-gray-600 mb-6">
          Prenez un ticket pour voir le docteur
        </p>

        <button
          onClick={handleTicket}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-lg transition"
        >
          🎟️ Prendre un ticket
        </button>

        <a
          href="/queue"
          className="mt-4 text-blue-500 hover:underline text-sm block"
        >
          Voir la file d’attente
        </a>
      </AnimatedPage>
    </Layout>
  );
}
