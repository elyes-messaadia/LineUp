import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout"; // Composant interne
import AnimatedPage from "../components/AnimatedPage"; // Nouveau composant interne

export default function Ticket() {
  const [ticket, setTicket] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem("lineup_ticket");
    if (stored) {
      setTicket(JSON.parse(stored));
    }
  }, []);

  const handleCancel = async () => {
    if (!ticket) return;

    await fetch(`http://localhost:5000/ticket/${ticket.id}`, {
      method: "DELETE",
    });

    localStorage.removeItem("lineup_ticket");
    navigate("/");
  };

  if (!ticket) {
    return (
      <Layout>
        <p>Aucun ticket trouvé.</p>
      </Layout>
    );
  }

  return (
    <Layout>
      <AnimatedPage>
        <h2 className="text-lg font-semibold mb-2 text-blue-600">
          🎫 Ticket n°{ticket.number}
        </h2>
        <p>
          Heure d’enregistrement :{" "}
          {new Date(ticket.createdAt).toLocaleTimeString()}
        </p>

        <button
          onClick={handleCancel}
          className="mt-6 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
        >
          Annuler mon ticket
        </button>
      </AnimatedPage>
    </Layout>
  );
}
