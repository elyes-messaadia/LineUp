import { useState, useEffect, useRef, useCallback } from 'react';
import BACKEND_URL from '../config/api';

export function useRealTimeQueue(onStatusChange = null) {
  const [queue, setQueue] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [isConnected, setIsConnected] = useState(true);
  
  const previousQueueRef = useRef([]);
  const pollIntervalRef = useRef(null);
  const isActiveRef = useRef(true);
  const retryCountRef = useRef(0);
  const maxRetries = 5;

  // Fonction pour comparer deux tickets et détecter les changements
  const detectChanges = useCallback((oldQueue, newQueue) => {
    const changes = [];
    
    // Créer des maps pour un accès plus rapide
    const oldMap = new Map(oldQueue.map(ticket => [ticket._id, ticket]));
    const newMap = new Map(newQueue.map(ticket => [ticket._id, ticket]));
    
    // Détecter les nouveaux tickets
    newQueue.forEach(newTicket => {
      if (!oldMap.has(newTicket._id)) {
        changes.push({
          type: 'new',
          ticket: newTicket,
          message: `🎟️ Nouveau ticket n°${newTicket.number} ajouté`
        });
      }
    });
    
    // Détecter les tickets supprimés (désistements)
    oldQueue.forEach(oldTicket => {
      if (!newMap.has(oldTicket._id)) {
        changes.push({
          type: 'removed',
          ticket: oldTicket,
          message: `❌ Ticket n°${oldTicket.number} a été annulé`
        });
      }
    });
    
    // Détecter les changements de statut
    newQueue.forEach(newTicket => {
      const oldTicket = oldMap.get(newTicket._id);
      if (oldTicket && oldTicket.status !== newTicket.status) {
        let message = '';
        let isImportant = false;
        
        switch (newTicket.status) {
          case 'en_consultation':
            message = `🩺 Ticket n°${newTicket.number} est maintenant en consultation`;
            isImportant = true;
            break;
          case 'termine':
            message = `✅ Ticket n°${newTicket.number} - consultation terminée`;
            break;
          case 'desiste':
            message = `❌ Ticket n°${newTicket.number} a été annulé`;
            break;
          case 'en_attente':
            message = `⏱️ Ticket n°${newTicket.number} est de retour en attente`;
            break;
          default:
            message = `📝 Ticket n°${newTicket.number} - statut mis à jour`;
        }
        
        changes.push({
          type: 'status_change',
          ticket: newTicket,
          oldStatus: oldTicket.status,
          newStatus: newTicket.status,
          message,
          isImportant
        });
      }
    });
    
    return changes;
  }, []);

  // Fonction de fetch avec gestion d'erreur améliorée
  const fetchQueue = useCallback(async () => {
    if (!isActiveRef.current) return;
    
    try {
      const response = await fetch(`${BACKEND_URL}/queue`);
      
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }
      
      const newQueue = await response.json();
      
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
      console.error('Erreur lors du fetch de la queue:', err);
      retryCountRef.current += 1;
      
      setError(err.message);
      setIsConnected(false);
      
      // Ne pas masquer le loading si c'est la première tentative
      if (!isLoading) {
        setLastUpdate(Date.now());
      }
      
      // Si trop d'erreurs consécutives, arrêter le polling automatique
      if (retryCountRef.current >= maxRetries) {
        console.warn('Trop d\'erreurs consécutives, arrêt du polling automatique');
        stopPolling();
      }
    }
  }, [isLoading, onStatusChange, detectChanges]);

  // Fonction pour forcer une mise à jour
  const forceUpdate = useCallback(() => {
    fetchQueue();
  }, [fetchQueue]);

  // Fonction pour démarrer le polling
  const startPolling = useCallback((interval = 2000) => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
    
    pollIntervalRef.current = setInterval(fetchQueue, interval);
  }, [fetchQueue]);

  // Fonction pour arrêter le polling
  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  // Effet principal
  useEffect(() => {
    isActiveRef.current = true;
    
    // Fetch initial
    fetchQueue();
    
    // Démarrer le polling
    startPolling(2000); // Toutes les 2 secondes
    
    // Cleanup
    return () => {
      isActiveRef.current = false;
      stopPolling();
    };
  }, [fetchQueue, startPolling, stopPolling]);

  // Gestion de la visibilité de la page (optimisation performance)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page cachée : polling moins fréquent
        startPolling(5000);
      } else {
        // Page visible : polling normal + mise à jour immédiate
        startPolling(2000);
        fetchQueue();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [startPolling, fetchQueue]);

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