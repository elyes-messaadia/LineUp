import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "./Layout";
import AnimatedPage from "./AnimatedPage";
import Toast from "./Toast";
import DashboardHeader from "./DashboardHeader";
import { useToast } from "../hooks/useToast";
import BACKEND_URL from "../config/api";
import { getDoctorDisplayName, getDoctorInfo } from "../config/doctors";
import { formatTime } from "../utils/dateUtils";

/**
 * Dashboard générique pour tous les médecins
 * @param {string} doctorId - ID du médecin
 */
export default function DoctorDashboard({ doctorId }) {
  const [user, setUser] = useState(null);
  const [queue, setQueue] = useState([]);
  const [myQueue, setMyQueue] = useState([]);
  const [currentPatient, setCurrentPatient] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toasts, showSuccess, showError, showWarning, showInfo, removeToast } = useToast();

  // Informations du médecin
  const doctorName = getDoctorDisplayName(doctorId);
  const doctorInfo = getDoctorInfo(doctorId);
  const themeColor = doctorInfo?.color || 'blue';

  // Charger les données de base
  const loadQueue = useCallback(async () => {
    try {
      // Charger seulement la file de ce docteur
      console.log(`🔍 Chargement queue pour ${doctorId}...`);
      const res = await fetch(`${BACKEND_URL}/queue?docteur=${doctorId}`);
      if (res.ok) {
        const doctorQueue = await res.json();
        console.log(`✅ Queue chargée pour ${doctorId}: ${doctorQueue.length} tickets`);
        
        // Vérifier que tous les tickets appartiennent bien au bon docteur
        const wrongTickets = doctorQueue.filter(ticket => ticket.docteur !== doctorId);
        if (wrongTickets.length > 0) {
          console.error(`❌ ERREUR FILTRAGE: ${wrongTickets.length} tickets n'appartiennent pas à ${doctorId}:`, wrongTickets);
          showError(`Erreur de filtrage: ${wrongTickets.length} tickets d'autres médecins apparaissent dans votre file!`);
        }
        
        setMyQueue(doctorQueue);
        
        // Trouver le patient actuel en consultation
        const current = doctorQueue.find(ticket => ticket.status === "en_consultation");
        setCurrentPatient(current);
      } else {
        console.error(`❌ Erreur chargement queue pour ${doctorId}: ${res.status}`);
        showError(`Erreur chargement de votre file d'attente (${res.status})`);
      }
      
      // Charger également la file globale pour les statistiques générales (optionnel)
      const globalRes = await fetch(`${BACKEND_URL}/queue`);
      if (globalRes.ok) {
        const globalData = await globalRes.json();
        console.log(`📊 File globale: ${globalData.length} tickets total`);
        setQueue(globalData);
      }
    } catch (error) {
      console.error("Erreur chargement queue:", error);
      showError("Erreur de connexion au serveur");
    }
  }, [doctorId, showError]);

  useEffect(() => {
    console.log(`🔄 DoctorDashboard useEffect triggered for doctorId: ${doctorId}`);
    
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
  }, [navigate, loadQueue, doctorId]); // Ajouter doctorId comme dépendance

  // Appeler le patient suivant
  const handleCallNext = async () => {
    const nextPatient = myQueue
      .filter(t => t.status === "en_attente")
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))[0];

    if (!nextPatient) {
      showWarning("Aucun patient en attente dans votre file");
      return;
    }

    if (currentPatient) {
      showWarning("Un patient est déjà en consultation");
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BACKEND_URL}/next?docteur=${doctorId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (res.ok) {
        const data = await res.json();
        showSuccess(`Patient n°${data.called.ticket.number} appelé en consultation !`);
        loadQueue();
      } else {
        const errorData = await res.json();
        throw new Error(errorData.message || `Erreur ${res.status}`);
      }
    } catch (error) {
      console.error("Erreur appel patient:", error);
      showError(error.message || "Impossible d'appeler le patient");
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
          title={`Dashboard - ${doctorName}`}
          onLogout={handleLogout}
        />

        <div className="max-w-6xl mx-auto space-y-6 px-4">
          
          {/* Patient actuel en consultation */}
          <div className={`bg-white rounded-lg shadow-md p-6 border-l-4 border-${themeColor}-500`}>
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              {doctorInfo?.emoji || '🩺'} Patient en consultation
            </h3>
            
            {currentPatient ? (
              <div className={`bg-${themeColor}-50 rounded-lg p-4`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className={`text-lg font-bold text-${themeColor}-800`}>
                      Ticket n°{currentPatient.number}
                    </h4>
                    <p className={`text-${themeColor}-600`}>
                      En consultation depuis {formatTime(currentPatient.updatedAt)}
                    </p>
                  </div>
                  <button
                    onClick={handleFinishConsultation}
                    disabled={isLoading}
                    className={`bg-${themeColor}-600 text-white px-4 py-2 rounded-lg hover:bg-${themeColor}-700 transition disabled:bg-gray-400`}
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
                  className={`mt-3 bg-${themeColor}-600 text-white px-6 py-2 rounded-lg hover:bg-${themeColor}-700 transition disabled:bg-gray-400`}
                >
                  {isLoading ? "⏳ Appel en cours..." : "📢 Appeler le patient suivant"}
                </button>
                {waitingPatients.length === 0 && (
                  <p className="text-gray-500 text-sm mt-2">Aucun patient en attente</p>
                )}
              </div>
            )}
          </div>

          {/* Statistiques du jour */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-2">📋 En attente</h4>
              <p className="text-3xl font-bold text-blue-600">{waitingPatients.length}</p>
              <p className="text-gray-600 text-sm">
                {waitingPatients.length > 0 ? `Prochain: n°${waitingPatients[0]?.number}` : "Aucun patient"}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-2">✅ Consultations</h4>
              <p className="text-3xl font-bold text-green-600">{completedToday.length}</p>
              <p className="text-gray-600 text-sm">Terminées aujourd'hui</p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-2">🏥 Total général</h4>
              <p className="text-3xl font-bold text-purple-600">{queue.length}</p>
              <p className="text-gray-600 text-sm">Patients dans la clinique</p>
            </div>
          </div>

          {/* File d'attente de ce médecin */}
          {waitingPatients.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                👥 Votre file d'attente ({waitingPatients.length} patients) - Dr. {doctorId}
              </h3>
              
              <div className="space-y-3">
                {waitingPatients.slice(0, 5).map((ticket, index) => (
                  <div 
                    key={ticket._id}
                    className={`flex justify-between items-center p-3 rounded-lg border ${
                      index === 0 ? `bg-${themeColor}-50 border-${themeColor}-200` : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className={`
                        px-2 py-1 rounded-full text-sm font-bold
                        ${index === 0 ? `bg-${themeColor}-600 text-white` : 'bg-gray-300 text-gray-700'}
                      `}>
                        #{ticket.number}
                      </span>
                      <span className="text-gray-600">
                        Arrivé à {formatTime(ticket.createdAt)}
                      </span>
                      {/* Afficher le docteur pour déboguer */}
                      <span className={`text-xs px-2 py-1 rounded ${
                        ticket.docteur === doctorId ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {ticket.docteur === doctorId ? '✅' : '❌'} {ticket.docteur}
                      </span>
                      {index === 0 && <span className="text-sm text-amber-600 font-medium">← Suivant</span>}
                    </div>
                  </div>
                ))}
                
                {waitingPatients.length > 5 && (
                  <p className="text-gray-500 text-sm text-center pt-2">
                    ... et {waitingPatients.length - 5} autres patients
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Toast Container */}
          <div className="fixed top-4 right-4 space-y-2 z-50">
            {toasts.map((toast) => (
              <Toast key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
            ))}
          </div>
        </div>
      </AnimatedPage>
    </Layout>
  );
} 