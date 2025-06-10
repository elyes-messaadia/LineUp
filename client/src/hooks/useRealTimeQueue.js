import { useState, useEffect, useRef, useCallback } from 'react';
import BACKEND_URL from '../config/api';

export function useRealTimeQueue(onStatusChange = null, selectedDoctor = null) {
  const [queue, setQueue] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [isConnected, setIsConnected] = useState(false);
  
  const previousQueueRef = useRef([]);
  const pollIntervalRef = useRef(null);
  const isActiveRef = useRef(true);
  const retryCountRef = useRef(0);
  const currentDoctorRef = useRef(selectedDoctor);
  const maxRetries = 5;
  const isMountedRef = useRef(true);

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

  // Fonction de fetch avec gestion d'erreur améliorée
  const fetchQueue = useCallback(async () => {
    if (!isActiveRef.current || !isMountedRef.current) return;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
      
      // Construire l'URL avec le paramètre docteur si spécifié
      let url = `${BACKEND_URL}/queue`;
      if (selectedDoctor) {
        url += `?docteur=${selectedDoctor}`;
      }
      
      console.log(`🔄 Fetching queue: ${url}`); // Debug
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }
      
      const newQueue = await response.json();
      
      if (!isMountedRef.current) return;
      
      // Vérifier que nous sommes toujours sur le même docteur (éviter race conditions)
      if (currentDoctorRef.current !== selectedDoctor) {
        console.log('🚫 Ignoring fetch result - doctor changed'); // Debug
        return;
      }
      
      console.log(`✅ Queue fetched: ${newQueue.length} tickets for doctor: ${selectedDoctor || 'all'}`); // Debug
      
      // Détecter les changements si ce n'est pas la première charge
      if (previousQueueRef.current.length > 0 && onStatusChange) {
        const changes = detectChanges(previousQueueRef.current, newQueue);
        if (changes.length > 0) {
          onStatusChange(changes);
        }
      }
      
      // Mettre à jour l'état
      setQueue(newQueue);
      setError(null);
      setIsConnected(true);
      setLastUpdate(Date.now());
      previousQueueRef.current = newQueue;
      retryCountRef.current = 0; // Reset du compteur d'erreurs
      
      if (isLoading) {
        setIsLoading(false);
      }
      
    } catch (err) {
      if (!isMountedRef.current) return;
      
      console.error('Erreur lors du fetch de la queue:', err);
      retryCountRef.current += 1;
      
      setError(err.name === 'AbortError' ? 'Timeout de connexion' : err.message);
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
    }
  }, [selectedDoctor, isLoading, onStatusChange, detectChanges]); // Inclure selectedDoctor pour refetch quand il change

  // Fonction pour forcer une mise à jour
  const forceUpdate = useCallback(() => {
    fetchQueue();
  }, [fetchQueue]);

  // Fonction pour démarrer le polling
  const startPolling = useCallback((interval = 2000) => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
    
    pollIntervalRef.current = setInterval(() => fetchQueue(), interval);
  }, [fetchQueue]);

  // Fonction pour arrêter le polling
  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  // Effet principal - se relance quand selectedDoctor change
  useEffect(() => {
    console.log(`🔄 Doctor changed to: ${selectedDoctor || 'all'}`); // Debug
    
    isActiveRef.current = true;
    isMountedRef.current = true;
    currentDoctorRef.current = selectedDoctor; // Mettre à jour la ref
    
    // Reset complet de l'état lors du changement de docteur
    setIsLoading(true);
    setQueue([]);
    setError(null);
    previousQueueRef.current = [];
    retryCountRef.current = 0;
    
    // Fetch initial immédiat
    fetchQueue();
    
    // Démarrer le polling avec un intervalle plus intelligent
    startPolling(8000); // Toutes les 8 secondes pour éviter de réveiller le backend trop souvent
    
    // Cleanup
    return () => {
      isActiveRef.current = false;
      isMountedRef.current = false;
      stopPolling();
    };
  }, [selectedDoctor]); // Uniquement selectedDoctor comme dépendance

  // Gestion de la visibilité de la page (optimisation performance)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page cachée : polling moins fréquent
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
        }
        pollIntervalRef.current = setInterval(() => fetchQueue(), 5000);
      } else {
        // Page visible : polling normal + mise à jour immédiate
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
        }
        pollIntervalRef.current = setInterval(() => fetchQueue(), 3000);
        fetchQueue();
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