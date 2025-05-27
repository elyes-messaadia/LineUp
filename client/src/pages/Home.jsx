import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import AnimatedPage from "../components/AnimatedPage";

export default function Home() {
  const navigate = useNavigate();
  const [isPatientConnected, setIsPatientConnected] = useState(false);

  useEffect(() => {
    const patientStatus = localStorage.getItem("isPatient");
    if (patientStatus === "true") {
      setIsPatientConnected(true);
    }
  }, []);

  const handleTicket = async () => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/ticket`, {
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

        {/* 👇 Affichage conditionnel des boutons si le patient N’EST PAS connecté */}
        {!isPatientConnected && (
          <div className="mt-8 flex flex-col gap-3 w-full">
            <button
              onClick={() => navigate("/login-patient")}
              className="w-full border border-blue-600 text-blue-600 py-2 rounded hover:bg-blue-50 transition"
            >
              Se connecter
            </button>

            <button
              onClick={() => navigate("/register-patient")}
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
            >
              S'inscrire
            </button>
          </div>
        )}
      </AnimatedPage>
    </Layout>
  );
}
