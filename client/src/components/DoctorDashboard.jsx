import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "./Layout";
import AnimatedPage from "./AnimatedPage";
import Toast from "./Toast";
import { useToast } from "../hooks/useToast";
import BACKEND_URL from "../config/api";
import { getDoctorDisplayName, getDoctorInfo } from "../config/doctors";
import { formatTime } from "../utils/dateUtils";

// Cache global pour les données des médecins (persiste entre les changements)
const DOCTOR_CACHE = new Map();
const CACHE_DURATION = 30000; // 30 secondes de cache
const MAX_CACHE_SIZE = 10;

// Fonction pour nettoyer le cache ancien
const cleanCache = () => {
  const now = Date.now();
  for (const [key, value] of DOCTOR_CACHE.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      DOCTOR_CACHE.delete(key);
    }
  }
  
  // Limiter la taille du cache
  if (DOCTOR_CACHE.size > MAX_CACHE_SIZE) {
    const oldestKey = DOCTOR_CACHE.keys().next().value;
    DOCTOR_CACHE.delete(oldestKey);
  }
};

// Hook personnalisé pour gérer le cache des données médecin
const useDoctorCache = (doctorId) => {
  const getCachedData = useCallback(() => {
    cleanCache();
    const cached = DOCTOR_CACHE.get(doctorId);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`📦 Données en cache trouvées pour ${doctorId}`);
      return cached.data;
    }
    return null;
  }, [doctorId]);

  const setCachedData = useCallback((data) => {
    cleanCache();
    DOCTOR_CACHE.set(doctorId, {
      data,
      timestamp: Date.now()
    });
    console.log(`💾 Données mises en cache pour ${doctorId}`);
  }, [doctorId]);

  return { getCachedData, setCachedData };
};

/**
 * Dashboard générique responsive pour tous les médecins avec optimisations de performance
 * @param {string} doctorId - ID du médecin
 */
export default function DoctorDashboard({ doctorId }) {
  const [user, setUser] = useState(null);
  const [queue, setQueue] = useState([]);
  const [myQueue, setMyQueue] = useState([]);
  const [currentPatient, setCurrentPatient] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingQueue, setIsLoadingQueue] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showStatistiquesModal, setShowStatistiquesModal] = useState(false);
  const [notes, setNotes] = useState('');
  const [diagnostic, setDiagnostic] = useState('');
  const [lastUpdate, setLastUpdate] = useState(null);
  
  // Références pour éviter les fuites mémoire
  const abortControllerRef = useRef(null);
  const intervalRef = useRef(null);
  const previousDoctorId = useRef(doctorId);
  
  const navigate = useNavigate();
  const { toasts, showSuccess, showError, showWarning, showInfo, removeToast } = useToast();
  const { getCachedData, setCachedData } = useDoctorCache(doctorId);

  // Informations du médecin memoïsées
  const doctorName = useMemo(() => getDoctorDisplayName(doctorId), [doctorId]);
  const doctorInfo = useMemo(() => getDoctorInfo(doctorId), [doctorId]);

  // Fonction optimisée pour charger les données avec cache
  const loadQueue = useCallback(async (useCache = true) => {
    // Annuler toute requête en cours
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Créer un nouveau controller pour cette requête
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    if (isLoading) return; // Éviter les appels concurrents
    
    // Vérifier le cache en premier
    if (useCache) {
      const cachedData = getCachedData();
      if (cachedData) {
        console.log(`⚡ Utilisation du cache pour ${doctorId}`);
        setMyQueue(cachedData.myQueue || []);
        setQueue(cachedData.queue || []);
        setCurrentPatient(cachedData.currentPatient || null);
        setLastUpdate(new Date(cachedData.lastUpdate));
        setIsLoadingQueue(false);
        return;
      }
    }
    
    setIsLoadingQueue(true);
    try {
      console.log(`🔍 Chargement optimisé pour ${doctorId}...`);
      
      // Requêtes optimisées avec timeout et signal d'abort
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 10000)
      );
      
      const apiPromises = Promise.race([
        Promise.all([
          fetch(`${BACKEND_URL}/queue?docteur=${doctorId}`, { signal }),
          fetch(`${BACKEND_URL}/stats`, { signal }).catch(() => 
            fetch(`${BACKEND_URL}/queue`, { signal }) // Fallback vers toute la queue
          )
        ]),
        timeoutPromise
      ]);

      const [doctorQueueRes, globalQueueRes] = await apiPromises;

      // Vérifier si la requête a été annulée
      if (signal.aborted) {
        console.log(`🚫 Requête annulée pour ${doctorId}`);
        return;
      }

      // Traitement de la file du docteur
      let myQueueData = [];
      let currentPatientData = null;
      
      if (doctorQueueRes.ok) {
        const doctorQueue = await doctorQueueRes.json();
        console.log(`✅ Queue chargée pour ${doctorId}: ${doctorQueue.length} tickets`);
        
        // Filtrage côté serveur normalement, mais vérification côté client par sécurité
        const validTickets = doctorQueue.filter(ticket => ticket.docteur === doctorId);
        if (validTickets.length !== doctorQueue.length) {
          console.warn(`⚠️ ${doctorQueue.length - validTickets.length} tickets filtrés côté client`);
        }
        
        myQueueData = validTickets;
        
        // Trouver le patient actuel en consultation
        currentPatientData = validTickets.find(ticket => ticket.status === "en_consultation");
      } else {
        console.error(`❌ Erreur chargement queue pour ${doctorId}: ${doctorQueueRes.status}`);
        showError(`Erreur chargement de votre file d'attente (${doctorQueueRes.status})`);
      }

      // Traitement des statistiques globales (optionnel et plus léger)
      let globalQueueData = [];
      if (globalQueueRes.ok) {
        const globalStats = await globalQueueRes.json();
        globalQueueData = globalStats.total || globalStats || []; // Support différents formats
        console.log(`📊 Stats globales: ${globalQueueData.length} tickets`);
      } else {
        console.warn("Erreur chargement stats globales, utilisation cache local");
        globalQueueData = queue; // Garder les données précédentes
      }
      
      const updateTime = new Date();
      
      // Mise à jour des états
      setMyQueue(myQueueData);
      setQueue(globalQueueData);
      setCurrentPatient(currentPatientData);
      setLastUpdate(updateTime);
      
      // Mise en cache des données
      setCachedData({
        myQueue: myQueueData,
        queue: globalQueueData,
        currentPatient: currentPatientData,
        lastUpdate: updateTime.toISOString()
      });
      
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log(`🚫 Requête annulée pour ${doctorId}`);
        return;
      }
      
      console.error("Erreur chargement queue:", error);
      
      // En cas d'erreur, essayer d'utiliser le cache même expiré
      const cachedData = getCachedData();
      if (cachedData) {
        console.log(`🔄 Utilisation du cache expiré en fallback pour ${doctorId}`);
        setMyQueue(cachedData.myQueue || []);
        setQueue(cachedData.queue || []);
        setCurrentPatient(cachedData.currentPatient || null);
        showWarning("Données en cache utilisées (connexion instable)");
      } else {
        showError("Erreur de connexion au serveur");
      }
    } finally {
      setIsLoadingQueue(false);
      setIsTransitioning(false);
    }
  }, [doctorId, showError, isLoading, getCachedData, setCachedData, queue]);

  // Gestion optimisée du changement de médecin
  useEffect(() => {
    if (previousDoctorId.current !== doctorId) {
      console.log(`🔄 Changement de médecin: ${previousDoctorId.current} → ${doctorId}`);
      setIsTransitioning(true);
      
      // Essayer d'utiliser le cache pour une transition fluide
      const cachedData = getCachedData();
      if (cachedData) {
        console.log(`⚡ Transition rapide avec cache pour ${doctorId}`);
        setMyQueue(cachedData.myQueue || []);
        setQueue(cachedData.queue || []);
        setCurrentPatient(cachedData.currentPatient || null);
        setLastUpdate(new Date(cachedData.lastUpdate));
        setIsLoadingQueue(false);
        setIsTransitioning(false);
      }
      
      previousDoctorId.current = doctorId;
    }
  }, [doctorId, getCachedData]);

  // Fonction de chargement manuel optimisée
  const refreshQueue = useCallback(async () => {
    if (isLoadingQueue) return;
    await loadQueue(false); // Forcer le rechargement sans cache
  }, [loadQueue, isLoadingQueue]);

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
    
    // Charger les données (avec cache si disponible)
    loadQueue();

    // Réduire la fréquence d'actualisation automatique pour éviter la surcharge
    // 20 secondes pour être plus respectueux du serveur et du cache
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    intervalRef.current = setInterval(() => {
      // Actualisation automatique moins fréquente en arrière-plan
      loadQueue(true); // Utiliser le cache si possible
    }, 20000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [navigate, loadQueue, doctorId]);

  // Appeler le patient suivant avec optimisations
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
        // Actualisation immédiate après action (sans cache)
        await loadQueue(false);
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

  // Terminer la consultation avec optimisations
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
        // Actualisation immédiate après action (sans cache)
        await loadQueue(false);
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

  // Sauvegarder les notes avec optimisations
  const sauvegarderNotes = async () => {
    if (!currentPatient) return;
    
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BACKEND_URL}/ticket/${currentPatient._id}/notes`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ notes, diagnostic })
      });

      if (res.ok) {
        showSuccess("Notes sauvegardées avec succès");
        setShowNotesModal(false);
        // Pas besoin de recharger toute la queue pour les notes
      } else {
        throw new Error(`Erreur ${res.status}`);
      }
    } catch (error) {
      console.error("Erreur sauvegarde notes:", error);
      showError("Impossible de sauvegarder les notes");
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

  // Calculs optimisés avec mémorisation
  const waitingPatients = useMemo(() => myQueue.filter(t => t.status === "en_attente"), [myQueue]);
  const completedToday = useMemo(() => myQueue.filter(t => t.status === "termine"), [myQueue]);
  
  const getStatusDisplay = useCallback((status) => {
    switch (status) {
      case 'en_attente': return 'En attente';
      case 'appelé': return 'Appelé';
      case 'en_cours': return 'En consultation';
      case 'termine': return 'Terminé';
      default: return status;
    }
  }, []);

  // Fonction utilitaire pour calculer le temps d'attente
  const calculateWaitingTime = useCallback((createdAt) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMinutes = Math.floor((now - created) / (1000 * 60));
    return diffMinutes;
  }, []);

  return (
    <Layout>
      <AnimatedPage>
        <div className="dashboard-container container-safe overflow-protection">
          {/* En-tête du dashboard avec indicateurs de performance */}
          <div className="dashboard-card mb-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div>
                <h1 className="dashboard-title text-overflow-safe" style={{ color: doctorInfo?.colorCode || '#1e40af' }}>
                  {doctorInfo?.emoji || '👨‍⚕️'} Dr. {doctorName}
                  {isLoadingQueue && <span className="ml-2 text-sm">⏳</span>}
                  {isTransitioning && <span className="ml-2 text-sm">🔄</span>}
                </h1>
                <p className="dashboard-subtitle text-overflow-safe">
                  {doctorInfo?.specialite || 'Médecin généraliste'} • Interface personnalisée
                  {lastUpdate && (
                    <span className="text-xs text-gray-500 block mt-1">
                      Dernière mise à jour : {lastUpdate.toLocaleTimeString('fr-FR')}
                      {DOCTOR_CACHE.has(doctorId) && <span className="ml-2">💾</span>}
                    </span>
                  )}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={refreshQueue}
                  disabled={isLoadingQueue || isLoading}
                  className="action-button action-button-secondary text-overflow-safe"
                >
                  {isLoadingQueue ? '⏳ Chargement...' : '🔄 Actualiser'}
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="action-button action-button-secondary text-overflow-safe"
                >
                  🏠 Accueil
                </button>
              </div>
            </div>
          </div>

          {/* Indicateurs de performance améliorés */}
          {isTransitioning && (
            <div className="alert-card bg-blue-50 border-l-4 border-blue-400 mb-4">
              <div className="p-1">
                <p className="text-responsive-base text-blue-800 text-overflow-safe">
                  🔄 Changement de médecin en cours... Transition optimisée activée
                </p>
              </div>
            </div>
          )}
          
          {isLoadingQueue && !isTransitioning && (
            <div className="alert-card bg-yellow-50 border-l-4 border-yellow-400 mb-4">
              <div className="p-1">
                <p className="text-responsive-base text-yellow-800 text-overflow-safe">
                  ⏳ Chargement de votre file d'attente en cours...
                  {DOCTOR_CACHE.has(doctorId) && <span className="ml-1">(Cache disponible)</span>}
                </p>
              </div>
            </div>
          )}

          {/* Patient en consultation actuelle */}
          {currentPatient ? (
            <div className="dashboard-section">
              <h2 className="dashboard-section-title text-overflow-safe">Patient en consultation</h2>
              <div className="alert-card bg-green-50 border-l-4 border-green-400">
                <div className="info-grid">
                  <div>
                    <p className="text-responsive-sm text-green-600 text-overflow-safe">Patient</p>
                    <div className="space-y-1">
                      <p className="text-responsive-lg font-semibold text-green-800 text-overflow-safe">
                        🎫 #{currentPatient.number}
                      </p>
                      {currentPatient.patientName && (
                        <p className="text-responsive-base font-medium text-blue-700 text-overflow-safe">
                          👤 {currentPatient.patientName}
                        </p>
                      )}
                      {currentPatient.ticketType === 'physique' && (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                          🎫 Physique
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-responsive-sm text-green-600 text-overflow-safe">Depuis</p>
                    <p className="text-responsive-lg font-semibold text-green-800 text-overflow-safe">
                      {formatTime(currentPatient.updatedAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-responsive-sm text-green-600 text-overflow-safe">Statut</p>
                    <p className="text-responsive-lg font-semibold text-green-800 text-overflow-safe">
                      🩺 En cours
                    </p>
                  </div>
                  <div>
                    <p className="text-responsive-sm text-green-600 text-overflow-safe">Docteur assigné</p>
                    <p className="text-responsive-lg font-semibold text-green-800 text-overflow-safe">
                      {currentPatient.docteur === doctorId ? '✅ Vous' : '❌ Autre'}
                    </p>
                  </div>
                </div>

                {/* Notes de consultation si disponibles */}
                {currentPatient.notes && (
                  <div className="mt-4 p-3 bg-yellow-50 border-l-4 border-yellow-300 rounded-r">
                    <p className="text-responsive-sm text-yellow-700 font-medium text-overflow-safe mb-1">
                      📝 Notes de la secrétaire
                    </p>
                    <p className="text-responsive-base text-yellow-800 text-overflow-safe italic">
                      {currentPatient.notes}
                    </p>
                  </div>
                )}
                
                <div className="mt-4 actions-grid">
                  <button
                    onClick={handleFinishConsultation}
                    disabled={isLoading}
                    className="action-button action-button-success text-overflow-safe"
                  >
                    {isLoading ? 'Finalisation...' : '✅ Terminer la consultation'}
                  </button>
                  <button
                    onClick={() => setShowNotesModal(true)}
                    className="action-button action-button-secondary text-overflow-safe"
                  >
                    📝 Ajouter des notes médicales
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="dashboard-section">
              <h2 className="dashboard-section-title text-overflow-safe">État de consultation</h2>
              <div className="alert-card bg-blue-50 border-l-4 border-blue-400">
                <div className="text-center py-4">
                  <div className="text-4xl mb-4">💤</div>
                  <h3 className="text-responsive-lg font-semibold text-blue-800 mb-2 text-overflow-safe">
                    Aucune consultation en cours
                  </h3>
                  <p className="text-responsive-base text-blue-700 mb-4 text-overflow-safe">
                    Vous êtes disponible pour recevoir le prochain patient
                  </p>
                  
                  {waitingPatients.length > 0 && !isLoadingQueue && (
                    <button
                      onClick={handleCallNext}
                      disabled={isLoading}
                      className="action-button action-button-primary text-overflow-safe"
                    >
                      {isLoading ? '⏳ Appel en cours...' : 
                       waitingPatients[0]?.patientName ? 
                       `📢 Appeler ${waitingPatients[0].patientName} (n°${waitingPatients[0].number})` :
                       `📢 Appeler le patient n°${waitingPatients[0]?.number}`}
                    </button>
                  )}
                  
                  {waitingPatients.length === 0 && !isLoadingQueue && (
                    <p className="text-responsive-sm text-blue-600 text-overflow-safe">
                      Aucun patient en attente dans votre file
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Statistiques personnelles */}
          <div className="dashboard-section">
            <h2 className="dashboard-section-title text-overflow-safe">Mes statistiques du jour</h2>
            <div className="stats-grid">
              <div className="stats-card">
                <div className="stats-number text-blue-600 text-overflow-safe">{waitingPatients.length}</div>
                <div className="stats-label text-overflow-safe">Patients en attente</div>
              </div>
              
              <div className="stats-card">
                <div className="stats-number text-green-600 text-overflow-safe">{completedToday.length}</div>
                <div className="stats-label text-overflow-safe">Consultations terminées</div>
              </div>
              
              <div className="stats-card">
                <div className="stats-number text-orange-600 text-overflow-safe">{myQueue.length}</div>
                <div className="stats-label text-overflow-safe">Total de ma file</div>
              </div>
              
              <div className="stats-card">
                <div className="stats-number text-purple-600 text-overflow-safe">
                  {Array.isArray(queue) ? queue.length : 0}
                </div>
                <div className="stats-label text-overflow-safe">Patients total clinique</div>
              </div>
            </div>
          </div>

          {/* Ma file d'attente avec pagination optimisée */}
          <div className="dashboard-section">
            <h2 className="dashboard-section-title text-overflow-safe">
              Ma file d'attente ({waitingPatients.length} patients)
            </h2>
            
            {isLoadingQueue && !isTransitioning ? (
              <div className="dashboard-card text-center">
                <div className="text-4xl mb-4">⏳</div>
                <h3 className="text-responsive-lg font-semibold text-gray-800 mb-2 text-overflow-safe">
                  Chargement de votre file...
                </h3>
                <p className="text-responsive-base text-gray-600 text-overflow-safe">
                  Optimisation en cours pour un chargement plus rapide.
                </p>
              </div>
            ) : waitingPatients.length > 0 ? (
              <div className="dashboard-grid">
                {waitingPatients.slice(0, 6).map((ticket, index) => (
                  <div key={ticket._id} className={`ticket-card ${index === 0 ? 'border-blue-500 bg-blue-50' : ''}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-responsive-lg font-semibold text-overflow-safe">
                          Position #{index + 1}
                          {index === 0 && (
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Prochain
                            </span>
                          )}
                        </h3>
                        <div className="space-y-1">
                          <p className="text-responsive-base text-gray-600 text-overflow-safe">
                            🎫 Ticket #{ticket.number}
                          </p>
                          {ticket.patientName && (
                            <p className="text-responsive-base font-medium text-blue-700 text-overflow-safe">
                              👤 {ticket.patientName}
                            </p>
                          )}
                          {ticket.ticketType === 'physique' && (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                              🎫 Ticket physique
                            </span>
                          )}
                          {ticket.createdBy === 'secretary' && (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full ml-2">
                              ✨ Créé par secrétaire
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-overflow-safe ${
                          ticket.status === 'appelé' ? 'bg-green-100 text-green-800' :
                          ticket.status === 'en_cours' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {getStatusDisplay(ticket.status)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="info-grid">
                      <div>
                        <p className="text-responsive-sm text-gray-500 text-overflow-safe">Arrivé à</p>
                        <p className="text-responsive-base font-medium text-overflow-safe">
                          {formatTime(ticket.createdAt)}
                        </p>
                      </div>
                      <div>
                        <p className="text-responsive-sm text-gray-500 text-overflow-safe">Temps d'attente</p>
                        <p className="text-responsive-base font-medium text-overflow-safe">
                          {calculateWaitingTime(ticket.createdAt)} min
                        </p>
                      </div>
                      <div>
                        <p className="text-responsive-sm text-gray-500 text-overflow-safe">Docteur assigné</p>
                        <p className={`text-responsive-base font-medium text-overflow-safe ${
                          ticket.docteur === doctorId ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {ticket.docteur === doctorId ? '✅ Vous' : '❌ Autre'}
                        </p>
                      </div>
                      <div>
                        <p className="text-responsive-sm text-gray-500 text-overflow-safe">Priorité</p>
                        <p className="text-responsive-base font-medium text-overflow-safe">
                          {ticket.priorite || 'Normale'}
                        </p>
                      </div>
                    </div>

                    {/* Notes de la secrétaire si disponibles */}
                    {ticket.notes && (
                      <div className="mt-2 p-2 bg-yellow-50 border-l-4 border-yellow-300 rounded-r">
                        <p className="text-responsive-sm text-yellow-700 font-medium text-overflow-safe">
                          📝 Notes
                        </p>
                        <p className="text-responsive-sm text-yellow-800 text-overflow-safe italic">
                          {ticket.notes}
                        </p>
                      </div>
                    )}
                    
                    {/* Indicateur si problème d'assignation */}
                    {ticket.docteur !== doctorId && (
                      <div className="mt-2 p-2 bg-red-50 border-l-4 border-red-400 rounded">
                        <p className="text-responsive-sm text-red-700 text-overflow-safe">
                          ⚠️ Ce ticket n'est pas assigné à vous : {ticket.docteur}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
                
                {waitingPatients.length > 6 && (
                  <div className="dashboard-card text-center">
                    <p className="text-responsive-base text-gray-600 text-overflow-safe">
                      ... et {waitingPatients.length - 6} autres patients en attente
                    </p>
                    <button
                      onClick={() => navigate('/queue')}
                      className="action-button action-button-secondary mt-2 text-overflow-safe"
                    >
                      Voir tous les patients
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="dashboard-card text-center">
                <div className="text-4xl mb-4">🎯</div>
                <h3 className="text-responsive-lg font-semibold text-gray-800 mb-2 text-overflow-safe">
                  Aucun patient en attente
                </h3>
                <p className="text-responsive-base text-gray-600 text-overflow-safe">
                  Votre file d'attente est actuellement vide. Profitez de cette pause !
                </p>
              </div>
            )}
          </div>

          {/* Actions rapides */}
          <div className="dashboard-section">
            <h2 className="dashboard-section-title text-overflow-safe">Actions rapides</h2>
            <div className="actions-grid">
              <button
                onClick={handleCallNext}
                disabled={isLoading || waitingPatients.length === 0 || currentPatient || isLoadingQueue}
                className="action-button action-button-primary text-overflow-safe"
              >
                {isLoading ? 'Appel...' : '📢 Appeler le suivant'}
              </button>
              
              <button
                onClick={() => setShowStatistiquesModal(true)}
                className="action-button action-button-secondary text-overflow-safe"
              >
                📊 Statistiques détaillées
              </button>
              
              <button
                onClick={() => navigate('/queue')}
                className="action-button action-button-secondary text-overflow-safe"
              >
                👥 Voir file complète
              </button>
              
              <button
                onClick={handleLogout}
                className="action-button action-button-secondary text-overflow-safe"
              >
                🔒 Déconnexion
              </button>
            </div>
          </div>

          {/* Messages d'erreur et de succès */}
          {toasts.map((toast) => (
            <div key={toast.id} className={`alert-card text-overflow-safe ${
              toast.type === 'error' ? 'bg-red-50 border-l-4 border-red-400' :
              toast.type === 'success' ? 'bg-green-50 border-l-4 border-green-400' :
              toast.type === 'warning' ? 'bg-yellow-50 border-l-4 border-yellow-400' :
              'bg-blue-50 border-l-4 border-blue-400'
            }`}>
              <div className="p-1">
                <p className={`text-responsive-base text-overflow-safe ${
                  toast.type === 'error' ? 'text-red-800' :
                  toast.type === 'success' ? 'text-green-800' :
                  toast.type === 'warning' ? 'text-yellow-800' :
                  'text-blue-800'
                }`}>
                  {toast.type === 'error' ? '❌' : 
                   toast.type === 'success' ? '✅' : 
                   toast.type === 'warning' ? '⚠️' : 'ℹ️'} {toast.message}
                </p>
              </div>
            </div>
          ))}

          {/* Modal notes */}
          {showNotesModal && (
            <div className="modal-overlay-fullscreen animate-overlay">
              <div className="modal-responsive animate-in bg-white p-6 rounded-lg shadow-xl">
                <h2 className="dashboard-title mb-4 text-overflow-safe">Ajouter des notes de consultation</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-responsive-base font-medium text-gray-700 mb-2 text-overflow-safe">
                      Notes de consultation
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows="6"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-overflow-safe"
                      placeholder="Observations, symptômes, examens effectués..."
                    />
                  </div>

                  <div>
                    <label className="block text-responsive-base font-medium text-gray-700 mb-2 text-overflow-safe">
                      Diagnostic et traitement
                    </label>
                    <textarea
                      value={diagnostic}
                      onChange={(e) => setDiagnostic(e.target.value)}
                      rows="4"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-overflow-safe"
                      placeholder="Diagnostic, traitement prescrit, recommandations..."
                    />
                  </div>

                  <div className="actions-grid">
                    <button
                      onClick={sauvegarderNotes}
                      disabled={isLoading}
                      className="action-button action-button-primary text-overflow-safe"
                    >
                      {isLoading ? 'Sauvegarde...' : '💾 Sauvegarder'}
                    </button>
                    <button
                      onClick={() => setShowNotesModal(false)}
                      className="action-button action-button-secondary text-overflow-safe"
                    >
                      ❌ Annuler
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modal statistiques détaillées */}
          {showStatistiquesModal && (
            <div className="modal-overlay-fullscreen animate-overlay">
              <div className="modal-responsive animate-in bg-white p-6 rounded-lg shadow-xl max-w-4xl">
                <h2 className="dashboard-title mb-4 text-overflow-safe">Statistiques détaillées - Dr. {doctorName}</h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="dashboard-section-title text-overflow-safe">Performance du jour</h3>
                    <div className="stats-grid">
                      <div className="stats-card">
                        <div className="stats-number text-green-600 text-overflow-safe">{completedToday.length}</div>
                        <div className="stats-label text-overflow-safe">Consultations terminées</div>
                      </div>
                      <div className="stats-card">
                        <div className="stats-number text-blue-600 text-overflow-safe">{waitingPatients.length}</div>
                        <div className="stats-label text-overflow-safe">Patients en attente</div>
                      </div>
                      <div className="stats-card">
                        <div className="stats-number text-orange-600 text-overflow-safe">
                          {completedToday.length > 0 ? Math.round((8 * 60) / completedToday.length) : 0} min
                        </div>
                        <div className="stats-label text-overflow-safe">Temps moyen par patient</div>
                      </div>
                      <div className="stats-card">
                        <div className="stats-number text-purple-600 text-overflow-safe">
                          {Math.round((completedToday.length / (myQueue.length || 1)) * 100)}%
                        </div>
                        <div className="stats-label text-overflow-safe">Taux de completion</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="dashboard-section-title text-overflow-safe">Répartition des statuts</h3>
                    <div className="info-grid">
                      <div className="stats-card">
                        <div className="stats-number text-gray-600 text-overflow-safe">
                          {myQueue.filter(t => t.status === 'en_attente').length}
                        </div>
                        <div className="stats-label text-overflow-safe">En attente</div>
                      </div>
                      <div className="stats-card">
                        <div className="stats-number text-blue-600 text-overflow-safe">
                          {myQueue.filter(t => t.status === 'en_consultation').length}
                        </div>
                        <div className="stats-label text-overflow-safe">En consultation</div>
                      </div>
                      <div className="stats-card">
                        <div className="stats-number text-green-600 text-overflow-safe">
                          {myQueue.filter(t => t.status === 'termine').length}
                        </div>
                        <div className="stats-label text-overflow-safe">Terminées</div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="text-xs text-gray-500 mb-4 text-overflow-safe">
                      Système de cache actif - Données mises à jour en temps réel 💾
                    </div>
                    <button
                      onClick={() => setShowStatistiquesModal(false)}
                      className="action-button action-button-secondary w-full text-overflow-safe"
                    >
                      ✅ Fermer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </AnimatedPage>
    </Layout>
  );
} 