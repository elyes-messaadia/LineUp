import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  const handleTicket = async () => {
    const res = await fetch("http://localhost:5000/ticket", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json();

    // 🔐 Stocker temporairement le ticket dans localStorage
    localStorage.setItem("lineup_ticket", JSON.stringify(data));

    // Redirection vers la page /ticket
    navigate("/ticket");
  };

  return (
    <div className="h-screen flex flex-col justify-center items-center text-center p-6 bg-gray-50">
      <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-extrabold mb-2 text-center">
        <span className="text-black">Bienvenue chez</span>{" "}
        <span className="text-blue-600">LineUp</span>
      </h1>

      <p className="text-gray-600 mb-6 max-w-md">
        Gagnez du temps en prenant un ticket numérique pour voir votre médecin.
        Vous serez notifié quand ce sera votre tour.
      </p>

      <button
        onClick={handleTicket}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-lg transition"
      >
        🎟️ Prendre un ticket
      </button>

      <a href="/queue" className="mt-4 text-blue-500 hover:underline text-sm">
        Voir la file d’attente
      </a>
    </div>
  );
}
