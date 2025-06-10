import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import AnimatedPage from "../../components/AnimatedPage";
import Toast from "../../components/Toast";
import DashboardHeader from "../../components/DashboardHeader";
import { useToast } from "../../hooks/useToast";
import BACKEND_URL from "../../config/api";
import { getDoctorDisplayName } from "../../config/doctors";

const DOCTOR_ID = 'dr-helios-blasco';
const DOCTOR_NAME = getDoctorDisplayName(DOCTOR_ID);

export default function DrHeliosDashboard() {
  const [user, setUser] = useState(null);
  const [queue, setQueue] = useState([]);
  const [myQueue, setMyQueue] = useState([]);
  const [currentPatient, setCurrentPatient] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toasts, showSuccess, showError, showWarning, showInfo, removeToast } = useToast();

  // Charger les données de base
  const loadQueue = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/queue`);
      if (res.ok) {
        const data = await res.json();
        setQueue(data);
        
        // Filtrer les tickets pour ce médecin
        const doctorQueue = data.filter(ticket => ticket.docteur === DOCTOR_ID);
        setMyQueue(doctorQueue);
        
        // Trouver le patient actuel en consultation
        const current = doctorQueue.find(ticket => ticket.status === "en_consultation");
        setCurrentPatient(current);
      }
    } catch (error) {
      console.error("Erreur chargement queue:", error);
      showError("Erreur de connexion au serveur");
    }
  }, [showError]);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    const isAuthenticated = localStorage.getItem("isAuthenticated");

    if (!userData || !isAuthenticated) {
      navigate("/login");
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role.name !== "medecin") {
      navigate("/login");
      return;
    }

    setUser(parsedUser);
    loadQueue();

    // Actualiser toutes les 3 secondes
    const interval = setInterval(loadQueue, 3000);
    return () => clearInterval(interval);
  }, [navigate, loadQueue]);

  // Appeler le patient suivant
  const handleCallNext = async () => {
    const nextPatient = myQueue
      .filter(t => t.status === "en_attente")
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))[0];

    if (!nextPatient) {
      showWarning("Aucun patient en attente");
      return;
    }

    if (currentPatient) {
      showWarning("Un patient est déjà en consultation");
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BACKEND_URL}/ticket/${nextPatient._id}/call`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (res.ok) {
        showSuccess(`Patient n°${nextPatient.number} appelé en consultation`);
        loadQueue();
      } else {
        throw new Error(`Erreur ${res.status}`);
      }
    } catch (error) {
      console.error("Erreur appel patient:", error);
      showError("Impossible d'appeler le patient");
    } finally {
      setIsLoading(false);
    }
  };

  // Terminer la consultation
  const handleFinishConsultation = async () => {
    if (!currentPatient) {
      showWarning("Aucun patient en consultation");
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BACKEND_URL}/ticket/${currentPatient._id}/finish`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (res.ok) {
        showSuccess(`Consultation du patient n°${currentPatient.number} terminée`);
        loadQueue();
      } else {
        throw new Error(`Erreur ${res.status}`);
      }
    } catch (error) {
      console.error("Erreur fin consultation:", error);
      showError("Impossible de terminer la consultation");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("isAuthenticated");
    showInfo("Déconnexion réussie");
    navigate("/");
  };

  const waitingPatients = myQueue.filter(t => t.status === "en_attente");
  const completedToday = myQueue.filter(t => t.status === "termine");

  return (
    <Layout>
      <AnimatedPage>
        <DashboardHeader 
          user={user}
          title={`Dashboard - ${DOCTOR_NAME}`}
          onLogout={handleLogout}
        />

        <div className="max-w-6xl mx-auto space-y-6 px-4">
          
          {/* Patient actuel en consultation */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              🩺 Patient en consultation
            </h3>
            
            {currentPatient ? (
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-lg font-bold text-blue-800">
                      Ticket n°{currentPatient.number}
                    </h4>
                    <p className="text-blue-600">
                      En consultation depuis {new Date(currentPatient.updatedAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <button
                    onClick={handleFinishConsultation}
                    disabled={isLoading}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
                  >
                    ✅ Terminer la consultation
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-gray-600">Aucun patient en consultation</p>
                <button
                  onClick={handleCallNext}
                  disabled={isLoading || waitingPatients.length === 0}
                  className="mt-3 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
                >
                  👋 Appeler le suivant
                </button>
              </div>
            )}
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{waitingPatients.length}</div>
                <div className="text-blue-800 font-medium">En attente</div>
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-6 border border-green-200">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {currentPatient ? 1 : 0}
                </div>
                <div className="text-green-800 font-medium">En consultation</div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-600">{completedToday.length}</div>
                <div className="text-gray-800 font-medium">Terminés aujourd'hui</div>
              </div>
            </div>
          </div>

          {/* File d'attente */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              📋 Ma file d'attente
            </h3>
            
            {waitingPatients.length > 0 ? (
              <div className="space-y-3">
                {waitingPatients
                  .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
                  .map((ticket, index) => (
                    <div 
                      key={ticket._id}
                      className={`
                        flex justify-between items-center p-4 rounded-lg border-2 transition-all
                        ${index === 0 
                          ? "bg-blue-50 border-blue-200 shadow-md" 
                          : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                        }
                      `}
                    >
                      <div className="flex items-center space-x-4">
                        <span className={`
                          px-3 py-2 rounded-full text-sm font-bold
                          ${index === 0 
                            ? "bg-blue-500 text-white" 
                            : "bg-blue-100 text-blue-700"
                          }
                        `}>
                          #{index + 1}
                        </span>
                        <div>
                          <span className="font-semibold text-lg">Ticket n°{ticket.number}</span>
                          <p className="text-sm text-gray-600">
                            Arrivé à {new Date(ticket.createdAt).toLocaleTimeString()}
                          </p>
                          {index === 0 && (
                            <span className="inline-block bg-blue-500 text-white px-2 py-1 rounded text-xs font-bold mt-1">
                              ⬅️ SUIVANT
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {index === 0 && !currentPatient && (
                        <button
                          onClick={handleCallNext}
                          disabled={isLoading}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
                        >
                          👋 Appeler
                        </button>
                      )}
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">😴</div>
                <p className="text-gray-600">Aucun patient en attente</p>
              </div>
            )}
          </div>

          {/* Actions rapides */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">⚡ Actions rapides</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => navigate("/queue")}
                className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition"
              >
                📊 Voir toute la file d'attente
              </button>
              <button
                onClick={loadQueue}
                className="bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700 transition"
              >
                🔄 Actualiser les données
              </button>
              <button
                onClick={() => navigate("/")}
                className="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition"
              >
                🏠 Retour à l'accueil
              </button>
            </div>
          </div>
        </div>

        {/* Notifications */}
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </AnimatedPage>
    </Layout>
  );
} 