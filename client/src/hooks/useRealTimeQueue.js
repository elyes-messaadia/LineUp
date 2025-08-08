import { useState, useEffect, useRef, useCallback } from 'react';
import BACKEND_URL from '../config/api';

// Cache global pour les données de file d'attente (persiste entre les changements)
const QUEUE_CACHE = new Map();
const CACHE_DURATION = 20000; // 20 secondes de cache pour la file d'attente
const MAX_CACHE_SIZE = 15;

// Fonction pour nettoyer le cache ancien
const cleanQueueCache = () => {
  const now = Date.now();
  for (const [key, value] of QUEUE_CACHE.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      QUEUE_CACHE.delete(key);
    }
  }
  
  // Limiter la taille du cache
  if (QUEUE_CACHE.size > MAX_CACHE_SIZE) {
    const oldestKey = QUEUE_CACHE.keys().next().value;
    QUEUE_CACHE.delete(oldestKey);
  }
};

// Hook personnalisé pour gérer le cache des files d'attente
const useQueueCache = (selectedDoctor) => {
  const cacheKey = selectedDoctor || 'all';
  
  const getCachedData = useCallback(() => {
    cleanQueueCache();
    const cached = QUEUE_CACHE.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`Données de file en cache trouvées pour ${cacheKey}`);
      return cached.data;
    }
    return null;
  }, [cacheKey]);

  const setCachedData = useCallback((data) => {
    cleanQueueCache();
    QUEUE_CACHE.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
    console.log(`File d'attente mise en cache pour ${cacheKey}`);
  }, [cacheKey]);

  return { getCachedData, setCachedData };
};

export function useRealTimeQueue(onStatusChange = null, selectedDoctor = null) {
  const [queue, setQueue] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [isConnected, setIsConnected] = useState(false);
  
  const previousQueueRef = useRef([]);
  const pollIntervalRef = useRef(null);
  const isActiveRef = useRef(true);
  const retryCountRef = useRef(0);
  const currentDoctorRef = useRef(selectedDoctor);
  const previousDoctorRef = useRef(selectedDoctor);
  const abortControllerRef = useRef(null);
  const maxRetries = 5;
  const isMountedRef = useRef(true);

  // Hook de cache
  const { getCachedData, setCachedData } = useQueueCache(selectedDoctor);

  // Fonction pour comparer deux tickets et détecter les changements
  const detectChanges = useCallback((oldQueue, newQueue) => {
    const changes = [];
    
    // Nouveaux tickets
    newQueue.forEach(newTicket => {
      if (!oldQueue.find(old => old._id === newTicket._id)) {
        changes.push({
          type: 'new',
          ticket: newTicket,
          message: `Nouveau ticket n°${newTicket.number} créé`
        });
      }
    });

    // Tickets supprimés/modifiés
    oldQueue.forEach(oldTicket => {
      const newTicket = newQueue.find(t => t._id === oldTicket._id);
      
      if (!newTicket) {
        changes.push({
          type: 'removed',
          ticket: oldTicket,
          message: `Ticket n°${oldTicket.number} supprimé`
        });
      } else if (oldTicket.status !== newTicket.status) {
        const isImportant = (oldTicket.status === 'en_attente' && newTicket.status === 'en_consultation');
        changes.push({
          type: 'status_change',
          ticket: newTicket,
          oldStatus: oldTicket.status,
          newStatus: newTicket.status,
          isImportant,
          message: `Ticket n°${newTicket.number}: ${oldTicket.status} → ${newTicket.status}`
        });
      }
    });
    
    return changes;
  }, []);

  // Fonction de fetch avec gestion d'erreur améliorée et cache
  const fetchQueue = useCallback(async (useCache = true) => {
    if (!isActiveRef.current || !isMountedRef.current) return;
    
    // Annuler toute requête en cours
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Créer un nouveau controller pour cette requête
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    
    // Vérifier le cache en premier si demandé
    if (useCache && !isLoading) {
      const cachedData = getCachedData();
      if (cachedData) {
        console.log(`⚡ Utilisation du cache pour la file: ${selectedDoctor || 'all'}`);
        setQueue(cachedData.queue);
        setLastUpdate(new Date(cachedData.lastUpdate).getTime());
        setError(null);
        setIsConnected(true);
        setIsTransitioning(false);
        // Pas de detection de changements pour les données en cache
        return;
      }
    }
    
    try {
      const timeoutId = setTimeout(() => abortControllerRef.current?.abort(), 12000); // 12s timeout
      
      // Construire l'URL avec le paramètre docteur si spécifié
      let url = `${BACKEND_URL}/queue`;
      if (selectedDoctor) {
        url += `?docteur=${selectedDoctor}`;
      }
      
      console.log(`Fetching queue optimisé: ${url}`); // Debug
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        signal: signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }
      
      const newQueue = await response.json();
      
      if (!isMountedRef.current) return;
      
      // Vérifier que nous sommes toujours sur le même docteur (éviter race conditions)
      if (currentDoctorRef.current !== selectedDoctor) {
        console.log('Ignoring fetch result - doctor changed'); // Debug
        return;
      }
      
      // Vérifier si la requête a été annulée
      if (signal.aborted) {
        console.log(`Requête annulée pour ${selectedDoctor || 'all'}`);
        return;
      }
      
      console.log(`✅ Queue fetched optimisé: ${newQueue.length} tickets for doctor: ${selectedDoctor || 'all'}`); // Debug
      
      const updateTime = Date.now();
      
      // Détecter les changements si ce n'est pas la première charge
      if (previousQueueRef.current.length > 0 && onStatusChange && !isTransitioning) {
        const changes = detectChanges(previousQueueRef.current, newQueue);
        if (changes.length > 0) {
          onStatusChange(changes);
        }
      }
      
      // Mettre à jour l'état
      setQueue(newQueue);
      setError(null);
      setIsConnected(true);
      setLastUpdate(updateTime);
      previousQueueRef.current = newQueue;
      retryCountRef.current = 0; // Reset du compteur d'erreurs
      
      // Mise en cache des données
      setCachedData({
        queue: newQueue,
        lastUpdate: updateTime
      });
      
      if (isLoading) {
        setIsLoading(false);
      }
      setIsTransitioning(false);
      
    } catch (err) {
      if (!isMountedRef.current) return;
      
      if (err.name === 'AbortError') {
        console.log(`Requête fetch annulée pour ${selectedDoctor || 'all'}`);
        return;
      }
      
      console.error('Erreur lors du fetch de la queue:', err);
      retryCountRef.current += 1;
      
      // En cas d'erreur, essayer d'utiliser le cache même expiré
      const cachedData = getCachedData();
      if (cachedData && retryCountRef.current < 3) {
        console.log(`Utilisation du cache expiré en fallback pour ${selectedDoctor || 'all'}`);
        setQueue(cachedData.queue);
        setLastUpdate(new Date(cachedData.lastUpdate).getTime());
        setError('Données en cache (connexion instable)');
      } else {
        setError(err.message);
      }
      
      setIsConnected(false);
      
      // Ne pas masquer le loading si c'est la première tentative
      if (!isLoading) {
        setLastUpdate(Date.now());
      }
      
      // Si trop d'erreurs consécutives, arrêter le polling automatique
      if (retryCountRef.current >= maxRetries) {
        console.warn('Trop d\'erreurs consécutives, arrêt du polling automatique');
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      }
      
      setIsTransitioning(false);
    }
  }, [selectedDoctor, isLoading, isTransitioning, onStatusChange, detectChanges, getCachedData, setCachedData]);

  // Fonction pour forcer une mise à jour
  const forceUpdate = useCallback(() => {
    fetchQueue(false); // Forcer le rechargement sans cache
  }, [fetchQueue]);

  // Fonction pour démarrer le polling
  const startPolling = useCallback((interval = 2000) => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
    
    pollIntervalRef.current = setInterval(() => fetchQueue(true), interval); // Utiliser le cache lors du polling
  }, [fetchQueue]);

  // Fonction pour arrêter le polling
  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  // Gestion optimisée du changement de médecin (nouvelle logique)
  useEffect(() => {
    if (previousDoctorRef.current !== selectedDoctor) {
      console.log(`Changement de médecin dans Queue: ${previousDoctorRef.current || 'all'} → ${selectedDoctor || 'all'}`);
      setIsTransitioning(true);
      
      // Essayer d'utiliser le cache pour une transition fluide
      const cachedData = getCachedData();
      if (cachedData) {
        console.log(`⚡ Transition rapide avec cache pour ${selectedDoctor || 'all'}`);
        setQueue(cachedData.queue);
        setLastUpdate(new Date(cachedData.lastUpdate).getTime());
        setError(null);
        setIsConnected(true);
        setIsLoading(false);
        setIsTransitioning(false);
        previousQueueRef.current = cachedData.queue;
      } else {
        // Pas de cache disponible, mais on évite le reset brutal
        setIsLoading(true);
        setError(null);
      }
      
      previousDoctorRef.current = selectedDoctor;
    }
  }, [selectedDoctor, getCachedData]);

  // Effet principal - configuration initiale et gestion des changements
  useEffect(() => {
    console.log(`useRealTimeQueue useEffect triggered for: ${selectedDoctor || 'all'}`); // Debug
    
    isActiveRef.current = true;
    isMountedRef.current = true;
    currentDoctorRef.current = selectedDoctor;
    
    // Pas de reset brutal ! On essaie d'abord le cache
    const cachedData = getCachedData();
    if (cachedData && !isTransitioning) {
      console.log(`Initialisation avec cache pour ${selectedDoctor || 'all'}`);
      setQueue(cachedData.queue);
      setLastUpdate(new Date(cachedData.lastUpdate).getTime());
      setError(null);
      setIsConnected(true);
      setIsLoading(false);
      previousQueueRef.current = cachedData.queue;
    } else if (!isTransitioning) {
      // Seulement si pas de cache et pas en transition
      setIsLoading(true);
      setError(null);
      retryCountRef.current = 0;
    }
    
    // Fetch immédiat (avec ou sans cache selon disponibilité)
    fetchQueue(!cachedData); // Si pas de cache, forcer le fetch
    
    // Démarrer le polling avec un intervalle intelligent
    startPolling(6000); // 6 secondes - équilibre entre réactivité et performance
    
    // Cleanup
    return () => {
      isActiveRef.current = false;
      isMountedRef.current = false;
      stopPolling();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [selectedDoctor, fetchQueue, startPolling, stopPolling, getCachedData, isTransitioning]);

  // Gestion de la visibilité de la page (optimisation performance)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page cachée : polling moins fréquent
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
        }
        pollIntervalRef.current = setInterval(() => fetchQueue(true), 12000); // 12s quand caché
      } else {
        // Page visible : polling normal + mise à jour immédiate
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
        }
        pollIntervalRef.current = setInterval(() => fetchQueue(true), 6000); // 6s quand visible
        fetchQueue(true); // Mise à jour immédiate avec cache possible
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchQueue]);

  // Calculer des statistiques utiles
  const stats = {
    total: queue.length,
    waiting: queue.filter(t => t.status === 'en_attente').length,
    inConsultation: queue.filter(t => t.status === 'en_consultation').length,
    completed: queue.filter(t => t.status === 'termine').length,
    cancelled: queue.filter(t => t.status === 'desiste').length
  };

  // Fonction pour obtenir la position d'un ticket dans la file
  const getPosition = useCallback((ticketId) => {
    const waitingTickets = queue
      .filter(t => t.status === 'en_attente')
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    
    const index = waitingTickets.findIndex(t => t._id === ticketId);
    return index !== -1 ? index + 1 : null;
  }, [queue]);

  // Fonction pour estimer le temps d'attente
  const getEstimatedWait = useCallback((position) => {
    if (!position || position <= 0) return 0;
    
    // Estimation de 15 minutes par consultation en moyenne
    const averageConsultationTime = 15; // minutes
    return (position - 1) * averageConsultationTime;
  }, []);

  return {
    queue,
    isLoading,
    isTransitioning, // Nouvel état pour indiquer les transitions
    error,
    lastUpdate,
    stats,
    isConnected,
    forceUpdate,
    getPosition,
    getEstimatedWait,
    startPolling,
    stopPolling
  };
} 