import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import AnimatedPage from "../../components/AnimatedPage";
import Toast from "../../components/Toast";
import ConfirmModal from "../../components/ConfirmModal";
import DoctorQueueSelector from "../../components/DoctorQueueSelector";

import { useToast } from "../../hooks/useToast";
import BACKEND_URL from "../../config/api";
import { getDoctorDisplayName } from "../../config/doctors";
import { RefreshCcw, CheckCircle2, Stethoscope, ClipboardList, Home as HomeIcon } from "lucide-react";

export default function SecretaireDashboard() {
  const [user, setUser] = useState(null);
  const [queue, setQueue] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDoctorForTicket, setSelectedDoctorForTicket] = useState('dr-husni-said-habibi');
  const [ticketType, setTicketType] = useState('numerique');
  const [patientName, setPatientName] = useState('');
  const [ticketNotes, setTicketNotes] = useState('');
  const [selectedDoctorForCall, setSelectedDoctorForCall] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [showCreateTicketModal, setShowCreateTicketModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [stats, setStats] = useState({});
  const [allStats, setAllStats] = useState({});
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const navigate = useNavigate();
  const { toasts, showSuccess, showError, showWarning, showInfo, removeToast } = useToast();

  // Mise à jour de l'heure en temps réel
  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timeInterval);
  }, []);

  // Surveillance de la connectivité
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showInfo("Connexion rétablie", 2000);
      fetchQueue(); // Rechargement automatique
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      showWarning("Connexion perdue - Mode hors ligne", 0);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showInfo, showWarning]);

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

    const interval = setInterval(() => {
      if (isOnline) {
        fetchQueue();
        fetchStats();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [navigate, selectedDoctor, isOnline]);

  const fetchQueue = async () => {
    try {
      let url = `${BACKEND_URL}/queue`;
      if (selectedDoctor) {
        url += `?docteur=${selectedDoctor}`;
      }
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setQueue(data);
        setLastUpdate(new Date());
        fetchStats();
        fetchAllStats();
      }
    } catch (error) {
      console.error("Erreur chargement queue:", error);
      if (isOnline) {
        showError("Erreur de connexion au serveur", 3000);
      }
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

    const completedToday = today.filter(t => t.status === "termine").length;
    const totalToday = today.length;
    const efficiency = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

    setStats({
      waitingCount: queue.filter(t => t.status === "en_attente").length,
      inConsultationCount: queue.filter(t => t.status === "en_consultation").length,
      completedToday,
      cancelledToday: today.filter(t => t.status === "desiste").length,
      totalToday,
      averageWaitTime: today.length > 0 ? Math.round(today.length * 15) : 0,
      efficiency
    });
  };

  const getWelcomeMessage = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Bonjour";
    if (hour < 18) return "Bon après-midi";
    return "Bonsoir";
  };

  const getActivityLevel = () => {
    const totalWaiting = stats.waitingCount || 0;
    if (totalWaiting === 0) return { level: "Calme", color: "green" };
    if (totalWaiting <= 5) return { level: "Normal", color: "blue" };
    if (totalWaiting <= 10) return { level: "Actif", color: "yellow" };
    return { level: "Très occupé", color: "red" };
  };

  const handleCallNext = (doctorId = null) => {
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

    const nextPatient = queue
      .filter(t => t.status === "en_attente")
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))[0];

    if (!nextPatient) {
      showWarning("Aucun patient en attente");
      return;
    }

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
        const errorMessage = errorData.message || `Erreur ${res.status}`;
        
        // Messages d'erreur personnalisés pour une meilleure UX
        if (errorMessage.includes("aucun patient")) {
          throw new Error("Aucun patient en attente pour ce médecin actuellement.");
        } else if (errorMessage.includes("déjà en consultation")) {
          throw new Error("Ce médecin a déjà un patient en consultation.");
        } else {
          throw new Error(errorMessage);
        }
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
          docteur: selectedDoctorForTicket,
          ticketType: ticketType,
          patientName: ticketType === 'physique' ? patientName : null,
          notes: ticketNotes || null,
          anonymous: ticketType === 'numerique'
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        const errorMessage = errorData.message || `Erreur ${res.status}`;
        
        // Messages d'erreur personnalisés pour une meilleure UX
        // (Les secrétaires peuvent créer plusieurs tickets sans restriction)
        if (errorMessage.includes("limite") && user.role.name !== 'secretaire') {
          throw new Error("Limite de tickets atteinte pour aujourd'hui.");
        } else {
          throw new Error(errorMessage);
        }
      }

      const data = await res.json();
      const ticketNumber = data.ticket?.number || data.number || "N/A";
      const patientDisplay = ticketType === 'physique' && patientName ? ` (${patientName})` : '';
      showSuccess(`Ticket n°${ticketNumber}${patientDisplay} créé pour ${getDoctorDisplayName(selectedDoctorForTicket)} !`, 4000);
      
      // Réinitialiser le formulaire
      setPatientName('');
      setTicketNotes('');
      setTicketType('numerique');
      
      fetchQueue();

    } catch (error) {
      console.error("Erreur création ticket:", error);
      showError(error.message || "Impossible de créer le ticket", 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetQueue = () => {
    setShowResetModal(true);
  };

  const confirmResetQueue = async () => {
    setShowResetModal(false);
    setIsLoading(true);

    try {
      showInfo("Réinitialisation de la file d'attente...");

      const url = selectedDoctor 
        ? `${BACKEND_URL}/reset?docteur=${selectedDoctor}`
        : `${BACKEND_URL}/reset`;

      const res = await fetch(url, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Erreur HTTP ${res.status}`);
      }

      const data = await res.json();
      const deletedCount = data.deletedCount || 0;
      const targetText = selectedDoctor ? `de ${getDoctorDisplayName(selectedDoctor)}` : "globale";
      
      showSuccess(`File d'attente ${targetText} réinitialisée ! ${deletedCount} ticket(s) supprimé(s)`, 5000);
      fetchQueue();

    } catch (error) {
      console.error("Erreur reset:", error);
      showError(`Impossible de réinitialiser la file: ${error.message}`, 5000);
    } finally {
      setIsLoading(false);
    }
  };



  if (!user) {
    return (
      <Layout>
        <AnimatedPage>
          <div className="loading-container">
            <div className="loading-content">
              <div className="loading-spinner animate-float" aria-hidden="true"></div>
              <p className="loading-text">Chargement du dashboard...</p>
            </div>
          </div>
        </AnimatedPage>
      </Layout>
    );
  }

  const activity = getActivityLevel();

  return (
    <Layout>
      <AnimatedPage>
        <div className="dashboard-wrapper">
          <div className="dashboard-container">
            
            {/* Header du dashboard amélioré avec informations en temps réel */}
            <div className="dashboard-header">
              <div className="dashboard-header-content">
                <div>
                  <h1 className="dashboard-title">Dashboard Secrétaire</h1>
                  <p className="dashboard-subtitle">
                    {getWelcomeMessage()}, {user.firstName} ! ✨ Gestion centralisée des consultations médicales
                  </p>
                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      {currentTime.toLocaleTimeString('fr-FR')}
                    </div>
                    <div className="flex items-center gap-2">
                      Activité: <span className={`font-medium text-${activity.color}-600`}>{activity.level}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isOnline ? "En ligne" : "Hors ligne"}
                    </div>
                    <div className="text-xs">
                      ↻ Dernière MAJ: {lastUpdate.toLocaleTimeString('fr-FR')}
                    </div>
                  </div>
                </div>
                <div className="dashboard-actions">
                  <button
                    onClick={() => navigate('/queue')}
                    className="btn-primary"
                  >
                    <span className="inline-flex items-center gap-2"><ClipboardList className="w-4 h-4" /> File complète</span>
                  </button>
                  <button
                    onClick={() => navigate('/admin')}
                    className="btn-secondary"
                  >
                    Administration
                  </button>
                  <button
                    onClick={() => navigate('/')}
                    className="btn-secondary"
                  >
                    <span className="inline-flex items-center gap-2"><HomeIcon className="w-4 h-4" /> Accueil</span>
                  </button>
                </div>
              </div>
            </div>

            <Toast toasts={toasts} removeToast={removeToast} />

            {/* Sélecteur de médecin */}
            <div className="dashboard-section">
              <DoctorQueueSelector 
                selectedDoctor={selectedDoctor}
                onDoctorChange={setSelectedDoctor}
              />
            </div>

            {/* Statistiques en temps réel améliorées */}
            <div className="dashboard-card dashboard-section">
              <h2 className="dashboard-card-title">Statistiques en temps réel</h2>
              <div className="stats-grid">
                <div className="stats-card stats-card-blue">
                  <div className="stats-number">{stats.waitingCount || 0}</div>
                  <div className="stats-label">Patients en attente</div>
                </div>
                <div className="stats-card stats-card-yellow">
                  <div className="stats-number">{stats.inConsultationCount || 0}</div>
                  <div className="stats-label">En consultation</div>
                </div>
                <div className="stats-card stats-card-green">
                  <div className="stats-number">{stats.completedToday || 0}</div>
                  <div className="stats-label">Consultations terminées</div>
                </div>
                <div className="stats-card stats-card-red">
                  <div className="stats-number">{stats.cancelledToday || 0}</div>
                  <div className="stats-label">Annulations du jour</div>
                </div>
                <div className="stats-card stats-card-purple">
                  <div className="stats-number">{stats.totalToday || 0}</div>
                  <div className="stats-label">Total journée</div>
                </div>
                <div className="stats-card stats-card-orange">
                  <div className="stats-number">{stats.efficiency || 0}%</div>
                  <div className="stats-label">Taux d'efficacité</div>
                </div>
              </div>
            </div>

            {/* État des médecins amélioré */}
            <div className="dashboard-card">
              <h3 className="dashboard-card-title">État des consultations en temps réel</h3>
              <div className="space-y-8">
                {['dr-husni-said-habibi', 'dr-helios-blasco', 'dr-jean-eric-panacciulli'].map((doctorId, index) => {
                  const doctorQueue = queue.filter(t => t.docteur === doctorId);
                  const inConsultation = doctorQueue.find(t => t.status === "en_consultation");
                  const waiting = doctorQueue.filter(t => t.status === "en_attente");
                  const nextPatient = waiting.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))[0];
                  const estimatedWaitTime = waiting.length * 15;
                  
                  return (
                    <div key={doctorId}>
                      <div className="doctor-status-card bg-white border-2 border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                        <h4 className="doctor-status-title text-lg font-bold text-gray-800 mb-6 pb-3 border-b border-gray-200">
                          {getDoctorDisplayName(doctorId)}
                        </h4>
                        
                        <div className="doctor-status-info space-y-6">
                          {/* État actuel */}
                          {inConsultation ? (
                            <div className="status-card status-card-consultation bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                              <div className="status-text text-yellow-800 font-semibold text-base inline-flex items-center gap-2"><Stethoscope className="w-4 h-4" /> Consultation en cours</div>
                              <div className="status-detail text-yellow-600 mt-2">
                                Ticket n°{inConsultation.number}
                                <span className="ml-3 text-sm">
                                  Depuis {new Date(inConsultation.updatedAt || inConsultation.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="status-card status-card-available bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg">
                              <div className="status-text text-green-800 font-semibold text-base inline-flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Médecin disponible</div>
                              <div className="status-detail text-green-600 mt-2">Prêt à recevoir un patient</div>
                            </div>
                          )}

                          {/* Patient suivant */}
                          {nextPatient ? (
                            <div className="status-card status-card-next bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                              <div className="status-text text-blue-800 font-semibold text-base">Prochain patient</div>
                              <div className="status-detail text-blue-600 mt-2">
                                Ticket n°{nextPatient.number}
                                <span className="ml-3 text-sm">
                                  Arrivé à {new Date(nextPatient.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="status-card status-card-empty bg-gray-50 border-l-4 border-gray-300 p-4 rounded-r-lg">
                               <div className="status-text text-gray-600 font-semibold text-base">File d'attente vide</div>
                              <div className="status-detail text-gray-500 mt-2">Aucun patient en attente</div>
                            </div>
                          )}

                          {/* Informations détaillées */}
                          <div className="bg-gray-50 rounded-lg p-4">
                            <div className="grid grid-cols-2 gap-6">
                              <div className="doctor-waiting-count text-center">
                                <div className="doctor-waiting-number text-2xl font-bold text-blue-600 mb-1">{waiting.length}</div>
                                <div className="doctor-waiting-label text-sm text-gray-600">patients en attente</div>
                              </div>
                              <div className="doctor-waiting-count text-center">
                                <div className="doctor-waiting-number text-2xl font-bold text-orange-600 mb-1">{estimatedWaitTime}min</div>
                                <div className="doctor-waiting-label text-sm text-gray-600">⏱️ temps d'attente estimé</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Séparateur entre médecins */}
                      {index < 2 && (
                        <div className="flex items-center justify-center py-4">
                          <div className="flex-1 border-t border-gray-200"></div>
                          <div className="px-4 text-gray-400 text-sm">• • •</div>
                          <div className="flex-1 border-t border-gray-200"></div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>



            {/* Layout en 2 colonnes pour desktop */}
            <div className="dashboard-grid-2 dashboard-section">
              
              {/* Colonne gauche - Actions principales */}
              <div className="space-y-8">
                
                {/* Création de ticket améliorée avec support physique */}
                <div className="dashboard-card">
                  <h3 className="dashboard-card-title">Nouveau ticket patient</h3>
                  <div className="space-y-6">
                    {/* Type de ticket */}
                    <div>
                      <label className="form-label">Type de ticket</label>
                      <div className="flex gap-4 mt-2">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="ticketType"
                            value="numerique"
                            checked={ticketType === 'numerique'}
                            onChange={(e) => setTicketType(e.target.value)}
                            className="mr-2"
                          />
                          <span className="text-sm font-medium">Numérique (QR Code)</span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="ticketType"
                            value="physique"
                            checked={ticketType === 'physique'}
                            onChange={(e) => setTicketType(e.target.value)}
                            className="mr-2"
                          />
                          <span className="text-sm font-medium">Physique (avec nom)</span>
                        </label>
                      </div>
                    </div>

                    {/* Nom du patient (si ticket physique) */}
                    {ticketType === 'physique' && (
                      <div>
                        <label className="form-label">Nom du patient *</label>
                        <input
                          type="text"
                          value={patientName}
                          onChange={(e) => setPatientName(e.target.value)}
                          placeholder="Ex: Marie Dupont"
                          className="form-input"
                          maxLength={100}
                          required
                        />
                        {!patientName && (
                          <p className="text-xs text-red-500 mt-1">Le nom est requis pour les tickets physiques</p>
                        )}
                      </div>
                    )}

                    <div>
                      <label className="form-label">Sélectionner le médecin</label>
                      <select
                        value={selectedDoctorForTicket}
                        onChange={(e) => setSelectedDoctorForTicket(e.target.value)}
                        className="form-select"
                      >
                        <option value="dr-husni-said-habibi">{getDoctorDisplayName('dr-husni-said-habibi')}</option>
                        <option value="dr-helios-blasco">{getDoctorDisplayName('dr-helios-blasco')}</option>
                        <option value="dr-jean-eric-panacciulli">{getDoctorDisplayName('dr-jean-eric-panacciulli')}</option>
                      </select>
                    </div>

                    {/* Notes optionnelles */}
                    <div>
                      <label className="form-label">Notes (optionnel)</label>
                      <textarea
                        value={ticketNotes}
                        onChange={(e) => setTicketNotes(e.target.value)}
                        placeholder="Notes particulières sur le patient..."
                        className="form-input resize-none"
                        rows={2}
                        maxLength={500}
                      />
                      <p className="text-xs text-gray-400 mt-1">{ticketNotes.length}/500 caractères</p>
                    </div>
                    
                    {/* Info sur la file d'attente du médecin sélectionné */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="text-sm font-medium text-blue-800 mb-1">
                        État de la file pour {getDoctorDisplayName(selectedDoctorForTicket)}
                      </div>
                      <div className="text-xs text-blue-600">
                        {(() => {
                          const doctorQueue = queue.filter(t => t.docteur === selectedDoctorForTicket);
                          const waiting = doctorQueue.filter(t => t.status === "en_attente").length;
                          const inConsultation = doctorQueue.find(t => t.status === "en_consultation");
                          
                          return (
                            <div className="flex items-center gap-4">
                              <span>{waiting} en attente</span>
                              <span>{inConsultation ? "En consultation" : "Disponible"}</span>
                              <span>~{waiting * 15}min d'attente</span>
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    <button
                      onClick={handleCreateTicket}
                      disabled={isLoading || !isOnline || (ticketType === 'physique' && !patientName.trim())}
                      className="btn-primary btn-full btn-large"
                    >
                      {isLoading ? "Création en cours..." : 
                       ticketType === 'physique' ? 
                       `Créer ticket physique ${patientName ? `pour ${patientName}` : ''}` :
                       "Créer ticket numérique"}
                    </button>
                    <div className="text-xs text-gray-500 text-center">
                      ✨ En tant que secrétaire, vous pouvez créer des tickets sans limite
                    </div>
                  </div>
                </div>

                {/* Actions rapides améliorées */}
                <div className="dashboard-card">
                  <h3 className="dashboard-card-title">
                      <span className="inline-flex items-center gap-2"><RefreshCcw className="w-4 h-4" /> Actions rapides</span>
                  </h3>
                  <div className="space-y-4">
                    <button
                      onClick={() => handleCallNext()}
                      disabled={isLoading || !isOnline || stats.waitingCount === 0}
                      className="btn-success btn-full btn-large"
                    >
                      {isLoading ? "Appel en cours..." : 
                       stats.waitingCount === 0 ? "Aucun patient en attente" :
                       "Appeler le patient suivant"}
                    </button>
                    
                  <button
                    onClick={() => fetchQueue()}
                    disabled={isLoading || !isOnline}
                    className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg border border-blue-600 hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
                  >
                    {isLoading ? "Actualisation..." : "Actualiser maintenant"}
                  </button>
                  </div>
                </div>

                {/* Bouton Reset Rouge Proéminent */}
                <div className="dashboard-card bg-gradient-to-r from-red-50 to-red-100 border-red-200">
                  <h3 className="dashboard-card-title text-red-700">
                    Gestion de la file d'attente
                  </h3>
                  <div className="space-y-3">
                    <div className="bg-white p-4 rounded-lg border border-red-200">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-sm text-red-600 font-medium">Action d'urgence</p>
                          <p className="text-xs text-gray-500">Supprimer tous les patients en attente</p>
                        </div>
                         <div className="text-2xl"> </div>
                      </div>
                      
                      <button
                        onClick={handleResetQueue}
                        disabled={isLoading || !isOnline}
                        className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white font-bold py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 shadow-lg hover:shadow-xl"
                      >
                        {isLoading ? (
                          <span className="flex items-center justify-center">
                             <span className="animate-spin mr-2"> </span>
                            Réinitialisation...
                          </span>
                        ) : (
                          <span className="flex items-center justify-center">
                             <span className="mr-2"> </span>
                            RÉINITIALISER TOUTES LES FILES
                          </span>
                        )}
                      </button>
                      
                      {stats.waitingCount > 0 && (
                        <p className="text-xs text-center text-red-500 mt-2">
                           {stats.waitingCount} patient{stats.waitingCount > 1 ? 's' : ''} en attente
                        </p>
                      )}
                    </div>
                  </div>
                </div>

              </div>

              {/* Colonne droite - Appels spécifiques par médecin */}
              <div className="dashboard-card">
                <h3 className="dashboard-card-title">
                  Appels spécifiques par médecin
                </h3>
                <div className="space-y-6">
                  {['dr-husni-said-habibi', 'dr-helios-blasco', 'dr-jean-eric-panacciulli'].map(doctorId => {
                    const doctorQueue = queue.filter(t => t.docteur === doctorId);
                    const waiting = doctorQueue.filter(t => t.status === "en_attente").length;
                    const inConsultation = doctorQueue.find(t => t.status === "en_consultation");
                    
                    return (
                      <div key={doctorId} className="border border-gray-200 rounded-xl p-4 bg-gradient-to-r from-white to-gray-50 hover:shadow-md transition-all duration-200">
                        <div className="grid grid-cols-12 gap-3 items-center">
                          <div className="col-span-8">
                              <h4 className="text-base font-bold text-gray-800 mb-1 leading-tight">{getDoctorDisplayName(doctorId)}</h4>
                            <div className="text-sm text-gray-600">
                              {waiting === 0 ? (
                                <span className="text-gray-500">Aucun patient en attente</span>
                              ) : inConsultation ? (
                                <div>
                                  <span className="text-yellow-600">En consultation</span>
                                  <div className="text-xs text-blue-600 mt-1">{waiting} patient{waiting > 1 ? 's' : ''} en attente</div>
                                </div>
                              ) : (
                                <div>
                                  <span className="text-green-600">Disponible</span>
                                  <div className="text-xs text-blue-600 mt-1">{waiting} patient{waiting > 1 ? 's' : ''} en attente</div>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="col-span-4 flex justify-end">
                            <button
                              onClick={() => handleCallNext(doctorId)}
                              disabled={isLoading || !isOnline || waiting === 0 || !!inConsultation}
                              className={`px-2 py-1.5 rounded-md font-medium text-xs transition-all duration-200 text-center w-full ${
                                waiting === 0 || !!inConsultation
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
                              }`}
                            >
                              {waiting === 0 ? "Aucun" :
                               inConsultation ? "Occupé" :
                               "Appeler"}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
            </div>

            {/* File détaillée si sélectionnée */}
            {selectedDoctor && (
              <div className="dashboard-card">
                <h3 className="dashboard-card-title">
                  <span className="inline-flex items-center gap-2"><ClipboardList className="w-4 h-4" /> File d'attente de {getDoctorDisplayName(selectedDoctor)}</span>
                </h3>
                {queue.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon"></div>
                    <p className="empty-text">Aucun patient dans cette file d'attente</p>
                     <p className="text-sm text-gray-400 mt-2">La consultation est libre !</p>
                  </div>
                ) : (
                  <div className="dashboard-grid">
                    {queue.map((ticket, index) => {
                      const waitTime = Math.round((new Date() - new Date(ticket.createdAt)) / 60000);
                      const position = queue.filter(t => t.status === "en_attente").findIndex(t => t._id === ticket._id) + 1;
                      
                      return (
                        <div key={ticket._id} className="ticket-card">
                          <div className="ticket-header">
                            <div className="flex flex-col">
                              <span className="ticket-number">#{ticket.number}</span>
                              {ticket.patientName && (
                                <span className="text-sm font-medium text-blue-700 mt-1">
                                  {ticket.patientName}
                                </span>
                              )}
                              {ticket.ticketType === 'physique' && (
                                <span className="text-xs text-purple-600 mt-1">
                                  Ticket physique
                                </span>
                              )}
                            </div>
                            <div className={`ticket-status ${
                              ticket.status === "en_consultation" ? "ticket-status-consultation" :
                              ticket.status === "en_attente" ? "ticket-status-waiting" :
                              ticket.status === "termine" ? "ticket-status-completed" :
                              "ticket-status-cancelled"
                            }`}>
                              {ticket.status === "en_attente" ? "⏳ En attente" :
                               ticket.status === "en_consultation" ? "En consultation" :
                               ticket.status === "termine" ? "✅ Terminé" : "❌ Annulé"}
                            </div>
                          </div>
                          
                          <div className="space-y-2 mt-3">
                            <div className="ticket-time">
                              Arrivée: {new Date(ticket.createdAt).toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                              {ticket.createdBy === 'secretary' && (
                                <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                  ✨ Créé par secrétaire
                                </span>
                              )}
                            </div>
                            
                            <div className="text-sm text-gray-600">
                              ⏱️ Temps d'attente: {waitTime}min
                            </div>

                            {ticket.notes && (
                              <div className="text-sm bg-gray-50 border-l-4 border-blue-300 p-2 rounded-r">
                                <span className="text-gray-700 italic">{ticket.notes}</span>
                              </div>
                            )}
                            
                            {ticket.status === "en_attente" && position > 0 && (
                              <div className="ticket-position">
                                Position {position} dans la file
                                <span className="text-xs block mt-1">
                                  ⏳ Temps estimé: ~{position * 15}min
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Modales avec style professionnel amélioré */}
            <ConfirmModal
              isOpen={showCallModal}
              title="Confirmation d'appel patient"
              message={
                <div className="modal-content-horizontal">
                  <div className="modal-icon"></div>
                  <div className="modal-text">
                    <p className="modal-title-text">
                      Voulez-vous appeler le patient suivant pour une consultation avec 
                      <span className="font-bold text-blue-600"> {getDoctorDisplayName(selectedDoctorForCall)}</span> ?
                    </p>
                    <p className="modal-subtitle-text">
                      Le patient sera automatiquement placé en consultation et retiré de la file d'attente.
                    </p>
                  </div>
                </div>
              }
              onConfirm={confirmCallNext}
              onCancel={() => {
                setShowCallModal(false);
                setSelectedDoctorForCall(null);
              }}
              confirmText="Confirmer l'appel"
              cancelText="❌ Annuler"
              isLoading={isLoading}
            />

            <ConfirmModal
              isOpen={showCreateTicketModal}
              title="Confirmation de création de ticket"
              message={
                <div className="modal-content-horizontal">
                  <div className="modal-icon"></div>
                  <div className="modal-text">
                    <p className="modal-title-text">
                      Voulez-vous créer un nouveau ticket de consultation pour 
                      <span className="font-bold text-blue-600"> {getDoctorDisplayName(selectedDoctorForTicket)}</span> ?
                    </p>
                    <p className="modal-subtitle-text">
                      Le ticket sera automatiquement ajouté à la file d'attente du médecin sélectionné.
                    </p>
                  </div>
                </div>
              }
              onConfirm={confirmCreateTicket}
              onCancel={() => setShowCreateTicketModal(false)}
              confirmText="Créer le ticket"
              cancelText="❌ Annuler"
              isLoading={isLoading}
            />

            <ConfirmModal
              isOpen={showResetModal}
              title="Confirmation de réinitialisation"
              message={
                <div className="modal-content-horizontal">
                  <div className="modal-icon"></div>
                  <div className="modal-text">
                    <p className="modal-title-text">
                      Voulez-vous vraiment réinitialiser {selectedDoctor ? 
                        `la file d'attente de ${getDoctorDisplayName(selectedDoctor)}` :
                        "TOUTES les files d'attente"
                      } ?
                    </p>
                    <p className="modal-subtitle-text">
                      Cette action supprimera <strong>définitivement</strong> tous les patients en attente ({stats.waitingCount || 0} ticket{(stats.waitingCount || 0) > 1 ? 's' : ''}).
                    </p>
                  </div>
                </div>
              }
              onConfirm={confirmResetQueue}
              onCancel={() => setShowResetModal(false)}
              confirmText="Confirmer la réinitialisation"
              cancelText="❌ Annuler"
              isLoading={isLoading}
            />


          </div>
        </div>
      </AnimatedPage>
    </Layout>
  );
} 