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
        <div className="dashboard-wrapper">
          <div className="dashboard-container">
            {/* En-tête modernisé avec meilleur alignement */}
            <div className="dashboard-header">
              <div className="dashboard-header-content">
                <div className="flex-1">
                  <h1 className="dashboard-title flex items-center gap-3">
                    <span className="text-4xl">{doctorInfo?.emoji || '👨‍⚕️'}</span>
                    <div>
                      <div style={{ color: doctorInfo?.colorCode || '#1e40af' }}>
                        {doctorName}
                      </div>
                      {(isLoadingQueue || isTransitioning) && (
                        <div className="flex items-center gap-2 mt-1">
                          {isLoadingQueue && <span className="text-lg animate-spin">⏳</span>}
                          {isTransitioning && <span className="text-lg animate-pulse">🔄</span>}
                        </div>
                      )}
                    </div>
                  </h1>
                  <p className="dashboard-subtitle">
                    {doctorInfo?.specialite || 'Médecin généraliste'} • Interface personnalisée
                  </p>
                  {lastUpdate && (
                    <div className="mt-2 text-sm text-gray-500 flex items-center gap-2">
                      <span>Dernière mise à jour : {lastUpdate.toLocaleTimeString('fr-FR')}</span>
                      {DOCTOR_CACHE.has(doctorId) && <span className="text-blue-600">💾</span>}
                    </div>
                  )}
                </div>
                <div className="dashboard-actions">
                  <button
                    onClick={refreshQueue}
                    disabled={isLoadingQueue || isLoading}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <span className={isLoadingQueue ? 'animate-spin' : ''}>🔄</span>
                    {isLoadingQueue ? 'Actualisation...' : 'Actualiser'}
                  </button>
                  <button
                    onClick={() => navigate('/')}
                    className="btn-secondary flex items-center gap-2"
                  >
                    🏠 Accueil
                  </button>
                </div>
              </div>
            </div>

            {/* Indicateurs d'état améliorés */}
            {isTransitioning && (
              <div className="dashboard-card bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-400 mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-2xl animate-spin">🔄</span>
                  <div>
                    <h3 className="font-semibold text-blue-800">Changement de médecin en cours</h3>
                    <p className="text-blue-700">Transition optimisée activée</p>
                  </div>
                </div>
              </div>
            )}
            
            {isLoadingQueue && !isTransitioning && (
              <div className="dashboard-card bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-400 mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-2xl animate-pulse">⏳</span>
                  <div>
                    <h3 className="font-semibold text-yellow-800">Chargement en cours</h3>
                    <p className="text-yellow-700">
                      Récupération de votre file d'attente...
                      {DOCTOR_CACHE.has(doctorId) && <span className="ml-1">(Cache disponible)</span>}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Section patient en consultation - Design amélioré */}
            <div className="dashboard-section">
              <h2 className="section-title">État de consultation</h2>
              {currentPatient ? (
                <div className="status-card status-card-consultation">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <div className="status-text flex items-center gap-3 mb-2">
                        <span className="text-3xl">🩺</span>
                        <span>Consultation en cours</span>
                      </div>
                      <div className="status-detail">
                        <div className="flex items-center gap-2 text-2xl font-bold text-green-700 mb-1">
                          🎫 #{currentPatient.number}
                        </div>
                        {currentPatient.patientName && (
                          <div className="flex items-center gap-2 text-lg font-medium text-blue-700">
                            👤 {currentPatient.patientName}
                          </div>
                        )}
                        {currentPatient.ticketType === 'physique' && (
                          <span className="inline-flex items-center px-3 py-1 text-sm font-medium bg-purple-100 text-purple-800 rounded-full mt-2">
                            🎫 Ticket physique
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-green-600 font-medium">Depuis</div>
                      <div className="text-lg font-semibold text-green-800">
                        {formatTime(currentPatient.updatedAt)}
                      </div>
                    </div>
                  </div>

                  {/* Notes de consultation si disponibles */}
                  {currentPatient.notes && (
                    <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-l-4 border-yellow-300 rounded-r-lg p-4 mb-6">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">📝</span>
                        <span className="font-medium text-yellow-700">Notes de la secrétaire</span>
                      </div>
                      <p className="text-yellow-800 italic">{currentPatient.notes}</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      onClick={handleFinishConsultation}
                      disabled={isLoading}
                      className="btn-success btn-large flex items-center justify-center gap-2"
                    >
                      <span className="text-lg">✅</span>
                      {isLoading ? 'Finalisation...' : 'Terminer la consultation'}
                    </button>
                    <button
                      onClick={() => setShowNotesModal(true)}
                      className="btn-secondary btn-large flex items-center justify-center gap-2"
                    >
                      <span className="text-lg">📝</span>
                      Ajouter des notes médicales
                    </button>
                  </div>
                </div>
              ) : (
                <div className="status-card status-card-available">
                  <div className="text-center py-8">
                    <div className="animate-float mb-6">
                      <span className="text-6xl">💤</span>
                    </div>
                    <div className="status-text mb-4">Disponible pour consultation</div>
                    <p className="text-blue-700 mb-6">
                      Vous êtes prêt à recevoir le prochain patient
                    </p>
                    
                    {waitingPatients.length > 0 && !isLoadingQueue && (
                      <button
                        onClick={handleCallNext}
                        disabled={isLoading}
                        className="btn-primary btn-large flex items-center justify-center gap-3 mx-auto"
                      >
                        <span className="text-xl">📢</span>
                        {isLoading ? (
                          <span className="flex items-center gap-2">
                            <span className="animate-spin">⏳</span>
                            Appel en cours...
                          </span>
                        ) : waitingPatients[0]?.patientName ? (
                          `Appeler ${waitingPatients[0].patientName} (n°${waitingPatients[0].number})`
                        ) : (
                          `Appeler le patient n°${waitingPatients[0]?.number}`
                        )}
                      </button>
                    )}
                    
                    {waitingPatients.length === 0 && !isLoadingQueue && (
                      <div className="empty-state">
                        <div className="empty-icon">🎯</div>
                        <div className="empty-text">Aucun patient en attente dans votre file</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Statistiques du jour - Design modernisé */}
            <div className="dashboard-section">
              <h2 className="section-title">Mes statistiques du jour</h2>
              <div className="stats-grid">
                <div className="stats-card stats-card-blue">
                  <div className="stats-number">{waitingPatients.length}</div>
                  <div className="stats-label">Patients en attente</div>
                </div>
                
                <div className="stats-card stats-card-green">
                  <div className="stats-number">{completedToday.length}</div>
                  <div className="stats-label">Consultations terminées</div>
                </div>
                
                <div className="stats-card stats-card-orange">
                  <div className="stats-number">{myQueue.length}</div>
                  <div className="stats-label">Total de ma file</div>
                </div>
                
                <div className="stats-card stats-card-purple">
                  <div className="stats-number">{Array.isArray(queue) ? queue.length : 0}</div>
                  <div className="stats-label">Patients total clinique</div>
                </div>
                
                <div className="stats-card stats-card-yellow">
                  <div className="stats-number">
                    {completedToday.length > 0 ? Math.round((8 * 60) / completedToday.length) : 0}
                  </div>
                  <div className="stats-label">Temps moyen (min)</div>
                </div>
                
                <div className="stats-card stats-card-red">
                  <div className="stats-number">
                    {Math.round((completedToday.length / (myQueue.length || 1)) * 100)}%
                  </div>
                  <div className="stats-label">Taux de completion</div>
                </div>
              </div>
            </div>

            {/* Ma file d'attente - Design amélioré */}
            <div className="dashboard-section">
              <h2 className="section-title flex items-center gap-3">
                <span className="text-2xl">👥</span>
                Ma file d'attente ({waitingPatients.length} patients)
              </h2>
              
              {isLoadingQueue && !isTransitioning ? (
                <div className="loading-container">
                  <div className="loading-content">
                    <div className="loading-spinner">⏳</div>
                    <div className="loading-text">
                      <h3>Chargement de votre file d'attente</h3>
                      <p>Optimisation en cours pour un chargement plus rapide</p>
                    </div>
                  </div>
                </div>
              ) : waitingPatients.length > 0 ? (
                <div className="dashboard-grid">
                  {waitingPatients.slice(0, 6).map((ticket, index) => (
                    <div key={ticket._id} className={`ticket-card ${index === 0 ? 'border-blue-500 bg-blue-50' : ''}`}>
                      <div className="ticket-header">
                        <div className="flex-1">
                          <div className="ticket-position">
                            Position #{index + 1}
                            {index === 0 && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 ml-2">
                                Prochain
                              </span>
                            )}
                          </div>
                          <div className="ticket-number">🎫 #{ticket.number}</div>
                          {ticket.patientName && (
                            <div className="flex items-center gap-2 text-base font-medium text-blue-700 mt-1">
                              👤 {ticket.patientName}
                            </div>
                          )}
                          <div className="flex gap-2 mt-2">
                            {ticket.ticketType === 'physique' && (
                              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                                🎫 Physique
                              </span>
                            )}
                            {ticket.createdBy === 'secretary' && (
                              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                                ✨ Secrétaire
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="ticket-status">
                          <span className={`ticket-status-waiting`}>
                            {getStatusDisplay(ticket.status)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div>
                          <div className="text-sm text-gray-500">Arrivé à</div>
                          <div className="ticket-time">{formatTime(ticket.createdAt)}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Temps d'attente</div>
                          <div className="ticket-time font-semibold text-orange-600">
                            {calculateWaitingTime(ticket.createdAt)} min
                          </div>
                        </div>
                      </div>

                      {/* Notes de la secrétaire si disponibles */}
                      {ticket.notes && (
                        <div className="mt-3 p-3 bg-gradient-to-r from-yellow-50 to-amber-50 border-l-4 border-yellow-300 rounded-r">
                          <div className="flex items-center gap-2 mb-1">
                            <span>📝</span>
                            <span className="text-sm font-medium text-yellow-700">Notes</span>
                          </div>
                          <p className="text-sm text-yellow-800 italic">{ticket.notes}</p>
                        </div>
                      )}
                      
                      {/* Indicateur si problème d'assignation */}
                      {ticket.docteur !== doctorId && (
                        <div className="mt-3 p-3 bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-400 rounded-r">
                          <div className="flex items-center gap-2">
                            <span>⚠️</span>
                            <span className="text-sm text-red-700">
                              Ticket non assigné à vous : {ticket.docteur}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {waitingPatients.length > 6 && (
                    <div className="dashboard-card text-center">
                      <div className="text-3xl mb-3">📋</div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">
                        {waitingPatients.length - 6} autres patients
                      </h3>
                      <p className="text-gray-600 mb-4">en attente dans votre file</p>
                      <button
                        onClick={() => navigate('/queue')}
                        className="btn-secondary"
                      >
                        Voir tous les patients
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">🎯</div>
                  <div className="empty-text">
                    <h3>Aucun patient en attente</h3>
                    <p>Votre file d'attente est actuellement vide. Profitez de cette pause !</p>
                  </div>
                </div>
              )}
            </div>

            {/* Actions rapides - Design modernisé */}
            <div className="dashboard-section">
              <h2 className="section-title flex items-center gap-3">
                <span className="text-2xl">⚡</span>
                Actions rapides
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  onClick={handleCallNext}
                  disabled={isLoading || waitingPatients.length === 0 || currentPatient || isLoadingQueue}
                  className="btn-primary btn-large flex items-center justify-center gap-2"
                >
                  <span className="text-lg">📢</span>
                  {isLoading ? 'Appel...' : 'Appeler le suivant'}
                </button>
                
                <button
                  onClick={() => setShowStatistiquesModal(true)}
                  className="btn-secondary btn-large flex items-center justify-center gap-2"
                >
                  <span className="text-lg">📊</span>
                  Statistiques détaillées
                </button>
                
                <button
                  onClick={() => navigate('/queue')}
                  className="btn-secondary btn-large flex items-center justify-center gap-2"
                >
                  <span className="text-lg">👥</span>
                  File complète
                </button>
                
                <button
                  onClick={handleLogout}
                  className="btn-secondary btn-large flex items-center justify-center gap-2"
                >
                  <span className="text-lg">🔒</span>
                  Déconnexion
                </button>
              </div>
            </div>

            {/* Messages d'erreur et de succès - Design amélioré */}
            {toasts.map((toast) => (
              <div key={toast.id} className={`dashboard-card ${
                toast.type === 'error' ? 'bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-400' :
                toast.type === 'success' ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-400' :
                toast.type === 'warning' ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border-l-4 border-yellow-400' :
                'bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-400'
              } mb-4`}>
                <div className="flex items-center gap-3">
                  <span className="text-xl">
                    {toast.type === 'error' ? '❌' : 
                     toast.type === 'success' ? '✅' : 
                     toast.type === 'warning' ? '⚠️' : 'ℹ️'}
                  </span>
                  <p className={`font-medium ${
                    toast.type === 'error' ? 'text-red-800' :
                    toast.type === 'success' ? 'text-green-800' :
                    toast.type === 'warning' ? 'text-yellow-800' :
                    'text-blue-800'
                  }`}>
                    {toast.message}
                  </p>
                </div>
              </div>
            ))}

                        {/* Modal notes - Design modernisé */}
            {showNotesModal && (
              <div className="modal-overlay-fullscreen animate-overlay">
                <div className="modal-responsive animate-in bg-white rounded-xl shadow-2xl">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">📝</span>
                      <h2 className="text-2xl font-bold text-gray-800">Notes de consultation</h2>
                    </div>
                  </div>
                  
                  <div className="p-6 space-y-6">
                    <div>
                      <label className="block text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <span className="text-lg">🩺</span>
                        Notes de consultation
                      </label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows="6"
                        className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-base"
                        placeholder="Observations, symptômes, examens effectués, état du patient..."
                      />
                    </div>

                    <div>
                      <label className="block text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <span className="text-lg">💊</span>
                        Diagnostic et traitement
                      </label>
                      <textarea
                        value={diagnostic}
                        onChange={(e) => setDiagnostic(e.target.value)}
                        rows="4"
                        className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-base"
                        placeholder="Diagnostic, traitement prescrit, recommandations, suivi..."
                      />
                    </div>
                  </div>

                  <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button
                        onClick={sauvegarderNotes}
                        disabled={isLoading}
                        className="btn-success btn-large flex items-center justify-center gap-2 order-2 md:order-1"
                      >
                        <span className="text-lg">{isLoading ? '⏳' : '💾'}</span>
                        {isLoading ? 'Sauvegarde en cours...' : 'Sauvegarder les notes'}
                      </button>
                      <button
                        onClick={() => setShowNotesModal(false)}
                        className="btn-secondary btn-large flex items-center justify-center gap-2 order-1 md:order-2"
                      >
                        <span className="text-lg">❌</span>
                        Annuler
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

                        {/* Modal statistiques détaillées - Design modernisé */}
            {showStatistiquesModal && (
              <div className="modal-overlay-fullscreen animate-overlay">
                <div className="modal-responsive animate-in bg-white rounded-xl shadow-2xl max-w-5xl">
                  <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">📊</span>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-800">Statistiques détaillées</h2>
                        <p className="text-lg text-gray-600">Dr. {doctorName}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6 space-y-8">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <span className="text-2xl">🎯</span>
                        Performance du jour
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="stats-card stats-card-green">
                          <div className="stats-number">{completedToday.length}</div>
                          <div className="stats-label">Consultations terminées</div>
                        </div>
                        <div className="stats-card stats-card-blue">
                          <div className="stats-number">{waitingPatients.length}</div>
                          <div className="stats-label">Patients en attente</div>
                        </div>
                        <div className="stats-card stats-card-orange">
                          <div className="stats-number">
                            {completedToday.length > 0 ? Math.round((8 * 60) / completedToday.length) : 0}
                          </div>
                          <div className="stats-label">Temps moyen (min)</div>
                        </div>
                        <div className="stats-card stats-card-purple">
                          <div className="stats-number">
                            {Math.round((completedToday.length / (myQueue.length || 1)) * 100)}%
                          </div>
                          <div className="stats-label">Taux de completion</div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <span className="text-2xl">📈</span>
                        Répartition des statuts
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="stats-card stats-card-yellow">
                          <div className="stats-number">
                            {myQueue.filter(t => t.status === 'en_attente').length}
                          </div>
                          <div className="stats-label">En attente</div>
                        </div>
                        <div className="stats-card stats-card-blue">
                          <div className="stats-number">
                            {myQueue.filter(t => t.status === 'en_consultation').length}
                          </div>
                          <div className="stats-label">En consultation</div>
                        </div>
                        <div className="stats-card stats-card-green">
                          <div className="stats-number">
                            {myQueue.filter(t => t.status === 'termine').length}
                          </div>
                          <div className="stats-label">Terminées</div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <span className="text-2xl">⚡</span>
                        Informations système
                      </h3>
                      <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <span className="text-xl">💾</span>
                          <span>Système de cache actif - Données mises à jour en temps réel</span>
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            Optimisé
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                    <button
                      onClick={() => setShowStatistiquesModal(false)}
                      className="btn-primary btn-large w-full flex items-center justify-center gap-2"
                    >
                      <span className="text-lg">✅</span>
                      Fermer les statistiques
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </AnimatedPage>
    </Layout>
  );
} 