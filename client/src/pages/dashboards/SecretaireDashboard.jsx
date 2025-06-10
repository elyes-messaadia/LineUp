import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import AnimatedPage from "../../components/AnimatedPage";
import Toast from "../../components/Toast";
import ConfirmModal from "../../components/ConfirmModal";
import DoctorQueueSelector from "../../components/DoctorQueueSelector";
import ResetQueueButton from "../../components/ResetQueueButton";
import { useToast } from "../../hooks/useToast";
import BACKEND_URL from "../../config/api";
import { getDoctorDisplayName } from "../../config/doctors";

export default function SecretaireDashboard() {
  const [user, setUser] = useState(null);
  const [queue, setQueue] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null); // null = toutes les files
  const [selectedDoctorForTicket, setSelectedDoctorForTicket] = useState('dr-husni-said-habibi'); // Docteur par défaut pour nouveaux tickets
  const [selectedDoctorForCall, setSelectedDoctorForCall] = useState(null); // Docteur pour appel patient
  const [isLoading, setIsLoading] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [showCreateTicketModal, setShowCreateTicketModal] = useState(false);
  const [stats, setStats] = useState({});
  const [allStats, setAllStats] = useState({}); // Statistiques par docteur
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
    if (parsedUser.role.name !== "secretaire") {
      navigate("/login");
      return;
    }

    setUser(parsedUser);
    fetchQueue();
    fetchStats();

    // Actualiser toutes les 5 secondes
    const interval = setInterval(() => {
      fetchQueue();
      fetchStats();
    }, 5000);

    return () => clearInterval(interval);
  }, [navigate, selectedDoctor]); // Ajouter selectedDoctor comme dépendance

  const fetchQueue = async () => {
    try {
      // Charger la file selon le docteur sélectionné
      let url = `${BACKEND_URL}/queue`;
      if (selectedDoctor) {
        url += `?docteur=${selectedDoctor}`;
      }
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setQueue(data);
        fetchStats();
        fetchAllStats();
      }
    } catch (error) {
      console.error("Erreur chargement queue:", error);
    }
  };

  const fetchAllStats = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/stats`);
      if (res.ok) {
        const data = await res.json();
        setAllStats(data);
      }
    } catch (error) {
      console.error("Erreur chargement statistiques:", error);
    }
  };

  const fetchStats = () => {
    const today = queue.filter(t => {
      const ticketDate = new Date(t.createdAt);
      const today = new Date();
      return ticketDate.toDateString() === today.toDateString();
    });

    setStats({
      waitingCount: queue.filter(t => t.status === "en_attente").length,
      inConsultationCount: queue.filter(t => t.status === "en_consultation").length,
      completedToday: today.filter(t => t.status === "termine").length,
      cancelledToday: today.filter(t => t.status === "desiste").length,
      totalToday: today.length,
      averageWaitTime: today.length > 0 ? Math.round(today.length * 15) : 0 // 15 min par patient
    });
  };

  const handleCallNext = (doctorId = null) => {
    // Si un docteur spécifique est demandé
    if (doctorId) {
      const doctorQueue = queue.filter(t => t.docteur === doctorId);
      const nextPatient = doctorQueue
        .filter(t => t.status === "en_attente")
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))[0];

      if (!nextPatient) {
        showWarning(`Aucun patient en attente pour ${getDoctorDisplayName(doctorId)}`);
        return;
      }

      const currentPatient = doctorQueue.find(t => t.status === "en_consultation");
      if (currentPatient) {
        showWarning(`${getDoctorDisplayName(doctorId)} a déjà un patient en consultation.`);
        return;
      }

      setSelectedDoctorForCall(doctorId);
      setShowCallModal(true);
      return;
    }

    // Logique globale si aucun docteur spécifique
    const nextPatient = queue
      .filter(t => t.status === "en_attente")
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))[0];

    if (!nextPatient) {
      showWarning("Aucun patient en attente");
      return;
    }

    // Vérifier si le docteur de ce patient est libre
    const doctorQueue = queue.filter(t => t.docteur === nextPatient.docteur);
    const currentPatient = doctorQueue.find(t => t.status === "en_consultation");
    if (currentPatient) {
      showWarning(`${getDoctorDisplayName(nextPatient.docteur)} a déjà un patient en consultation.`);
      return;
    }

    setSelectedDoctorForCall(nextPatient.docteur);
    setShowCallModal(true);
  };

  const confirmCallNext = async () => {
    setShowCallModal(false);
    setIsLoading(true);

    try {
      showInfo("Appel du patient suivant...");

      if (!selectedDoctorForCall) {
        throw new Error("Aucun docteur sélectionné");
      }

      const res = await fetch(`${BACKEND_URL}/next?docteur=${selectedDoctorForCall}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Erreur ${res.status}`);
      }

      const data = await res.json();
      showSuccess(`Patient n°${data.called.ticket.number} appelé en consultation pour ${getDoctorDisplayName(selectedDoctorForCall)} !`, 4000);
      fetchQueue();

    } catch (error) {
      console.error("Erreur appel patient:", error);
      showError(error.message || "Impossible d'appeler le patient suivant", 5000);
    } finally {
      setIsLoading(false);
      setSelectedDoctorForCall(null);
    }
  };

  const handleCreateTicket = () => {
    setShowCreateTicketModal(true);
  };

  const confirmCreateTicket = async () => {
    setShowCreateTicketModal(false);
    setIsLoading(true);

    try {
      showInfo("Création d'un ticket patient...");

      const res = await fetch(`${BACKEND_URL}/ticket`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ 
          userId: user._id,
          docteur: selectedDoctorForTicket
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Erreur ${res.status}`);
      }

      const data = await res.json();
      showSuccess(`Ticket n°${data.ticket.number} créé pour ${getDoctorDisplayName(selectedDoctorForTicket)} !`, 4000);
      fetchQueue();

    } catch (error) {
      console.error("Erreur création ticket:", error);
      showError(error.message || "Impossible de créer le ticket", 5000);
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

  const handleResetComplete = (result) => {
    showSuccess(`✅ ${result.message} - ${result.deletedCount} ticket(s) supprimé(s)`, 5000);
    fetchQueue(); // Recharger la file
    fetchStats(); // Recharger les statistiques
  };

  const handleResetError = (error) => {
    showError(`❌ Erreur de réinitialisation: ${error}`, 5000);
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
        <div className="max-w-6xl mx-auto">
          {/* En-tête secrétaire */}
          <div className="bg-pink-50 border border-pink-200 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-xl font-bold text-pink-800">
                  👩‍💼 Espace Secrétaire
                </h1>
                <p className="text-pink-600">
                  Bienvenue {user.fullName || 
                            (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : '') ||
                            user.firstName || 
                            user.lastName || 
                            user.email?.split('@')[0] || 
                            'utilisateur'}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="text-sm text-red-600 hover:text-red-800 underline"
              >
                🔒 Déconnexion
              </button>
            </div>
          </div>

          {/* Sélecteur de file d'attente par docteur */}
          <DoctorQueueSelector 
            selectedDoctor={selectedDoctor}
            onDoctorChange={setSelectedDoctor}
          />

          {/* Sélection docteur pour créer un ticket */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">
              🎟️ Création de ticket
            </h3>
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-blue-700">Docteur pour le nouveau ticket :</span>
              <select
                value={selectedDoctorForTicket}
                onChange={(e) => setSelectedDoctorForTicket(e.target.value)}
                className="px-3 py-2 border border-blue-300 rounded-md bg-white text-blue-800"
              >
                <option value="dr-husni-said-habibi">{getDoctorDisplayName('dr-husni-said-habibi')}</option>
                <option value="dr-helios-blasco">{getDoctorDisplayName('dr-helios-blasco')}</option>
                <option value="dr-jean-eric-panacciulli">{getDoctorDisplayName('dr-jean-eric-panacciulli')}</option>
              </select>
            </div>
          </div>

          {/* Statistiques du jour */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.waitingCount}</p>
              <p className="text-sm text-blue-800">En attente</p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-yellow-600">{stats.inConsultationCount}</p>
              <p className="text-sm text-yellow-800">En consultation</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{stats.completedToday}</p>
              <p className="text-sm text-green-800">Terminées</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-red-600">{stats.cancelledToday}</p>
              <p className="text-sm text-red-800">Annulées</p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-purple-600">{stats.totalToday}</p>
              <p className="text-sm text-purple-800">Total du jour</p>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-orange-600">{stats.averageWaitTime}</p>
              <p className="text-sm text-orange-800">Attente (min)</p>
            </div>
          </div>

          {/* Actions principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <button
              onClick={handleCreateTicket}
              disabled={isLoading}
              className="p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:bg-gray-400"
            >
              🎟️ Créer un ticket
              <div className="text-xs mt-1 opacity-75">
                pour {getDoctorDisplayName(selectedDoctorForTicket)}
              </div>
            </button>

            <button
              onClick={() => handleCallNext()}
              disabled={isLoading}
              className="p-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:bg-gray-400"
            >
              📢 Appeler le suivant
              <div className="text-xs mt-1 opacity-75">
                (prochain global)
              </div>
            </button>

            <button
              onClick={() => navigate("/queue")}
              className="p-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
            >
              📋 File complète
            </button>

            <button
              onClick={() => navigate("/admin")}
              className="p-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
            >
              ⚙️ Gestion admin
            </button>

            {/* Bouton de réinitialisation */}
            <div className="flex items-center justify-center">
              <ResetQueueButton
                selectedDoctor={selectedDoctor}
                onResetComplete={handleResetComplete}
                onError={handleResetError}
                className="w-full h-full flex flex-col items-center justify-center p-4"
              />
            </div>
          </div>

          {/* Actions par docteur */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-800 mb-4">📢 Appels par médecin</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => handleCallNext('dr-husni-said-habibi')}
                disabled={isLoading}
                className="p-3 bg-orange-100 border border-orange-200 text-orange-800 rounded-lg hover:bg-orange-200 transition font-medium disabled:bg-gray-200"
              >
                📞 Dr. Husni
                <div className="text-xs mt-1 opacity-75">
                  Appeler le suivant
                </div>
              </button>
              
              <button
                onClick={() => handleCallNext('dr-helios-blasco')}
                disabled={isLoading}
                className="p-3 bg-teal-100 border border-teal-200 text-teal-800 rounded-lg hover:bg-teal-200 transition font-medium disabled:bg-gray-200"
              >
                📞 Dr. Helios
                <div className="text-xs mt-1 opacity-75">
                  Appeler le suivant
                </div>
              </button>
              
              <button
                onClick={() => handleCallNext('dr-jean-eric-panacciulli')}
                disabled={isLoading}
                className="p-3 bg-cyan-100 border border-cyan-200 text-cyan-800 rounded-lg hover:bg-cyan-200 transition font-medium disabled:bg-gray-200"
              >
                📞 Dr. Jean-Eric
                <div className="text-xs mt-1 opacity-75">
                  Appeler le suivant
                </div>
              </button>
            </div>
          </div>

          {/* État actuel par docteur */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-800 mb-4">👨‍⚕️ État des consultations par médecin</h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {['dr-husni-said-habibi', 'dr-helios-blasco', 'dr-jean-eric-panacciulli'].map(doctorId => {
                const doctorQueue = queue.filter(t => t.docteur === doctorId);
                const inConsultation = doctorQueue.find(t => t.status === "en_consultation");
                const waiting = doctorQueue.filter(t => t.status === "en_attente");
                const nextPatient = waiting.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))[0];
                
                return (
                  <div key={doctorId} className="border border-gray-200 rounded-lg p-3">
                    <h4 className="font-medium text-gray-700 mb-2 text-sm">
                      {getDoctorDisplayName(doctorId)}
                    </h4>
                    
                    {/* Patient en consultation */}
                    {inConsultation ? (
                      <div className="bg-green-50 border border-green-200 rounded p-2 mb-2">
                        <p className="text-xs text-green-700 font-semibold">
                          🩺 En consultation: #{inConsultation.number}
                        </p>
                        <p className="text-xs text-green-600">
                          Depuis {new Date(inConsultation.updatedAt).toLocaleTimeString()}
                        </p>
                      </div>
                    ) : (
                      <div className="bg-gray-50 border border-gray-200 rounded p-2 mb-2">
                        <p className="text-xs text-gray-500">💤 Libre</p>
                      </div>
                    )}
                    
                    {/* Prochain patient */}
                    {nextPatient ? (
                      <div className="bg-blue-50 border border-blue-200 rounded p-2">
                        <p className="text-xs text-blue-700 font-semibold">
                          ⏭️ Suivant: #{nextPatient.number}
                        </p>
                        <p className="text-xs text-blue-600">
                          Attente: {getEstimatedTime(1)}
                        </p>
                      </div>
                    ) : (
                      <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                        <p className="text-xs text-yellow-600">📭 Aucun patient en attente</p>
                      </div>
                    )}
                    
                    {/* Indicateur file */}
                    <div className="mt-2 text-center">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        {waiting.length} en attente
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* File d'attente résumée */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-800">📋 File d'attente</h3>
              <span className="text-sm text-gray-500">
                Mise à jour automatique toutes les 5 secondes
              </span>
            </div>
            
            {queue.filter(t => t.status === "en_attente").length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">🎯</div>
                <p>Aucun patient en attente</p>
                <button
                  onClick={handleCreateTicket}
                  className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  🎟️ Créer le premier ticket
                </button>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {queue
                  .filter(t => t.status === "en_attente")
                  .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
                  .map((ticket, index) => (
                    <div key={ticket._id} className={`flex justify-between items-center p-3 rounded-lg border ${
                      index === 0 ? "bg-green-50 border-green-200" : "bg-blue-50 border-blue-200"
                    }`}>
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          index === 0 ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                        }`}>
                          Position {index + 1}
                        </span>
                        <span className="font-semibold">Ticket n°{ticket.number}</span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          👨‍⚕️ {getDoctorDisplayName(ticket.docteur)}
                        </span>
                        {index === 0 && <span className="text-green-600 font-semibold">⬅️ SUIVANT</span>}
                      </div>
                      <div className="text-sm text-gray-600">
                        <span>{new Date(ticket.createdAt).toLocaleTimeString()}</span>
                        <span className="ml-2">({getEstimatedTime(index + 1)} d'attente)</span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Tableau de bord rapide */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Actions fréquentes */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">⚡ Actions fréquentes</h3>
              <div className="space-y-2">
                <button
                  onClick={handleCreateTicket}
                  className="w-full text-left px-4 py-2 text-gray-700 hover:bg-blue-100 rounded-lg transition"
                >
                  🎟️ Créer un ticket pour un patient
                </button>
                <button
                  onClick={() => navigate("/queue")}
                  className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
                >
                  📋 Voir la file détaillée
                </button>
                <button
                  onClick={() => navigate("/admin")}
                  className="w-full text-left px-4 py-2 text-gray-700 hover:bg-purple-100 rounded-lg transition"
                >
                  👥 Gérer les utilisateurs
                </button>
                <button
                  onClick={() => navigate("/")}
                  className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
                >
                  🏠 Retour à l'accueil
                </button>
              </div>
            </div>

            {/* Informations utiles */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">ℹ️ Informations</h3>
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Temps moyen par consultation :</strong> 15 minutes
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>Heure de pointe :</strong> 9h-11h et 14h-16h
                  </p>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Capacité recommandée :</strong> 4 patients/heure max
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Modales de confirmation */}
          <ConfirmModal
            isOpen={showCallModal}
            title="Appeler le patient suivant"
            message={selectedDoctorForCall ? 
              `Voulez-vous appeler le patient suivant pour ${getDoctorDisplayName(selectedDoctorForCall)} ? Assurez-vous que le médecin est prêt.` :
              "Voulez-vous appeler le patient suivant en consultation ? Assurez-vous que le médecin est prêt."
            }
            confirmText="Oui, appeler"
            cancelText="Annuler"
            type="info"
            onConfirm={confirmCallNext}
            onCancel={() => {
              setShowCallModal(false);
              setSelectedDoctorForCall(null);
            }}
          />

          <ConfirmModal
            isOpen={showCreateTicketModal}
            title="Créer un ticket"
            message={`Voulez-vous créer un ticket pour ${getDoctorDisplayName(selectedDoctorForTicket)} pour un patient qui se présente à l'accueil ?`}
            confirmText="Oui, créer"
            cancelText="Annuler"
            type="info"
            onConfirm={confirmCreateTicket}
            onCancel={() => setShowCreateTicketModal(false)}
          />

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
        </div>
      </AnimatedPage>
    </Layout>
  );
} 