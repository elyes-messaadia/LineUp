import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import AnimatedPage from "../../components/AnimatedPage";
import Toast from "../../components/Toast";
import ConfirmModal from "../../components/ConfirmModal";
import DashboardHeader from "../../components/DashboardHeader";
import { useToast } from "../../hooks/useToast";
import BACKEND_URL from "../../config/api";
import { getDoctorDashboardRoute } from "../../utils/doctorMapping";

export default function MedecinDashboard() {
  const [user, setUser] = useState(null);
  const [queue, setQueue] = useState([]);
  const [currentPatient, setCurrentPatient] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [stats, setStats] = useState({});
  const navigate = useNavigate();
  const { toasts, showSuccess, showError, showWarning, showInfo, removeToast } = useToast();

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

    // Rediriger vers le dashboard spécifique du médecin
    const specificDashboard = getDoctorDashboardRoute(parsedUser);
    console.log(`Redirection médecin ${parsedUser.username || parsedUser.email} vers ${specificDashboard}`);
    
    if (specificDashboard !== "/dashboard/medecin") {
      navigate(specificDashboard, { replace: true });
    }

    fetchQueue();

    // Actualiser toutes les secondes
    const interval = setInterval(() => {
      fetchQueue();
    }, 1000);

    return () => clearInterval(interval);
  }, [navigate]);

  const fetchQueue = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/queue`);
      if (res.ok) {
        const data = await res.json();
        setQueue(data);
        
        // Trouver le patient en consultation
        const inConsultation = data.find(t => t.status === "en_consultation");
        setCurrentPatient(inConsultation);

        // Calculer les statistiques avec les données fraîches
        const today = data.filter(t => {
          const ticketDate = new Date(t.createdAt);
          const todayDate = new Date();
          return ticketDate.toDateString() === todayDate.toDateString();
        });

        setStats({
          waitingCount: data.filter(t => t.status === "en_attente").length,
          inConsultationCount: data.filter(t => t.status === "en_consultation").length,
          completedToday: today.filter(t => t.status === "termine").length,
          cancelledToday: today.filter(t => t.status === "desiste").length,
          totalToday: today.length
        });
      }
    } catch (error) {
      // Silencieux pour ne pas spam les erreurs
    }
  };

  const handleCallNext = () => {
    const nextPatient = queue
      .filter(t => t.status === "en_attente")
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))[0];

    if (!nextPatient) {
      showWarning("Aucun patient en attente");
      return;
    }

    if (currentPatient) {
      showWarning("Un patient est déjà en consultation. Terminez d'abord cette consultation.");
      return;
    }

    setShowCallModal(true);
  };

  // Fonction pour jouer le son de notification
  const playNotificationSound = () => {
    const audio = new Audio("/notify.mp3");
    audio.play().catch(() => {});
  };

  const confirmCallNext = async () => {
    setShowCallModal(false);
    setIsLoading(true);

    try {
      showInfo("Appel du patient suivant...");

      const res = await fetch(`${BACKEND_URL}/next`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      });

      if (!res.ok) {
        throw new Error(`Erreur ${res.status}`);
      }

      const data = await res.json();
      playNotificationSound(); // Jouer le son quand on appelle un patient
      showSuccess(`Patient n°${data.called.number} appelé en consultation !`, 4000);
      fetchQueue();

    } catch (error) {
      console.error("Erreur appel patient:", error);
      showError("Impossible d'appeler le patient suivant", 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinishConsultation = () => {
    if (!currentPatient) {
      showWarning("Aucun patient en consultation");
      return;
    }
    setShowFinishModal(true);
  };

  const confirmFinishConsultation = async () => {
    if (!currentPatient) return;

    setShowFinishModal(false);
    setIsLoading(true);

    try {
      showInfo("Finalisation de la consultation...");

      const res = await fetch(`${BACKEND_URL}/ticket/${currentPatient._id}/finish`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      });

      if (!res.ok) {
        throw new Error(`Erreur ${res.status}`);
      }

      showSuccess(`Consultation du patient n°${currentPatient.number} terminée !`, 4000);
      setCurrentPatient(null);
      fetchQueue();

    } catch (error) {
      console.error("Erreur fin consultation:", error);
      showError("Impossible de terminer la consultation", 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetQueue = () => {
    if (queue.length === 0) {
      showInfo("La file d'attente est déjà vide");
      return;
    }
    setShowResetModal(true);
  };

  const confirmResetQueue = async () => {
    setShowResetModal(false);
    setIsLoading(true);

    try {
      showWarning("Réinitialisation de la file d'attente...");

      const res = await fetch(`${BACKEND_URL}/reset`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      });

      if (!res.ok) {
        throw new Error(`Erreur ${res.status}`);
      }

      showSuccess("File d'attente réinitialisée avec succès !", 4000);
      setCurrentPatient(null);
      fetchQueue();

    } catch (error) {
      console.error("Erreur reset:", error);
      showError("Impossible de réinitialiser la file d'attente", 5000);
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

  // Estimation du temps d'attente
  const getEstimatedTime = (position) => {
    const avgConsultationTime = 15; // 15 minutes par consultation
    const totalMinutes = position * avgConsultationTime;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours > 0) {
      return `${hours}h${minutes.toString().padStart(2, '0')}`;
    }
    return `${minutes} min`;
  };

  if (!user) {
    return (
      <Layout>
        <AnimatedPage>
          <div className="text-center">
            <div className="animate-spin text-4xl mb-4">⏳</div>
            <p>Chargement...</p>
          </div>
        </AnimatedPage>
      </Layout>
    );
  }

  return (
    <Layout>
      <AnimatedPage>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-6xl mb-6">🩺</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              Dashboard Médecin
            </h1>
            
            {user && (
              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  Bonjour {user.firstName} {user.lastName} ({user.username || user.email})
                </p>
                <p className="text-sm text-gray-500">
                  Votre dashboard spécifique n'a pas pu être trouvé automatiquement.
                </p>
              </div>
            )}
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">
                Sélectionnez votre dashboard :
              </h3>
              
              <div className="grid gap-4 md:grid-cols-3">
                <button
                  onClick={() => navigate("/dashboard/dr-husni-said-habibi")}
                  className="p-4 border-2 border-blue-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all"
                >
                  <div className="text-2xl mb-2">👨‍⚕️</div>
                  <div className="font-semibold">Dr. Husni SAID HABIBI</div>
                  <div className="text-sm text-gray-600">Médecin généraliste</div>
                </button>
                
                <button
                  onClick={() => navigate("/dashboard/dr-helios-blasco")}
                  className="p-4 border-2 border-green-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition-all"
                >
                  <div className="text-2xl mb-2">🩺</div>
                  <div className="font-semibold">Dr. Helios BLASCO</div>
                  <div className="text-sm text-gray-600">Médecin généraliste</div>
                </button>
                
                <button
                  onClick={() => navigate("/dashboard/dr-jean-eric-panacciulli")}
                  className="p-4 border-2 border-purple-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-all"
                >
                  <div className="text-2xl mb-2">👩‍⚕️</div>
                  <div className="font-semibold">Dr. Jean-Eric PANACCIULLI</div>
                  <div className="text-sm text-gray-600">Médecin généraliste</div>
                </button>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={() => navigate("/")}
                className="text-blue-600 hover:text-blue-800 transition-colors"
              >
                ← Retour à l'accueil
              </button>
            </div>
          </div>
        </div>
      </AnimatedPage>
    </Layout>
  );
} 