import { useState, useCallback } from 'react';

export function useToast() {
  const [toasts, setToasts] = useState([]);

  // Son de notification
  const playNotificationSound = useCallback((type = 'info') => {
    try {
      // Utiliser uniquement l'API Web Audio pour créer des bips
      const createBeep = (frequency = 800, duration = 200, volume = 0.3) => {
        try {
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.value = frequency;
          oscillator.type = 'sine';
          
          gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
          
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + duration / 1000);
        } catch (e) {
          // Ignore si l'API audio n'est pas supportée
          console.warn('Audio API non supportée:', e);
        }
      };

      // Sons différents selon le type
      switch (type) {
        case 'important':
          createBeep(1000, 300, 0.5); // Son plus aigu et long
          setTimeout(() => createBeep(800, 200, 0.4), 150);
          setTimeout(() => createBeep(1000, 200, 0.3), 300);
          break;
        case 'error':
          createBeep(400, 400, 0.6); // Son grave pour erreur
          break;
        case 'warning':
          createBeep(600, 250, 0.4); // Son moyen pour avertissement
          setTimeout(() => createBeep(600, 150, 0.3), 200);
          break;
        case 'success':
          createBeep(800, 150, 0.3); // Son aigu court pour succès
          setTimeout(() => createBeep(1000, 100, 0.2), 100);
          break;
        default:
          createBeep(800, 200, 0.3); // Son standard
      }

      // Vibration pour les notifications importantes (mobiles)
      if (type === 'important' && 'vibrate' in navigator) {
        navigator.vibrate([300, 100, 300, 100, 300]);
      }
    } catch (error) {
      // Ignore toutes les erreurs audio
      console.warn('Erreur audio:', error);
    }
  }, []);

  const showToast = useCallback((message, type = 'info', duration = 3000, playSound = false) => {
    const id = Date.now() + Math.random();
    const newToast = { id, message, type, duration };
    
    setToasts(prev => [...prev, newToast]);
    
    // Jouer le son si demandé
    if (playSound) {
      playNotificationSound(type);
    }
    
    // Auto-remove après la durée spécifiée
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, duration + 300); // +300ms pour l'animation
  }, [playNotificationSound]);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const showSuccess = useCallback((message, duration, playSound = false) => {
    showToast(message, 'success', duration, playSound);
  }, [showToast]);

  const showError = useCallback((message, duration, playSound = true) => {
    showToast(message, 'error', duration, playSound);
  }, [showToast]);

  const showWarning = useCallback((message, duration, playSound = true) => {
    showToast(message, 'warning', duration, playSound);
  }, [showToast]);

  const showInfo = useCallback((message, duration, playSound = false) => {
    showToast(message, 'info', duration, playSound);
  }, [showToast]);

  // Notification spéciale pour les changements de statut critiques
  const showImportant = useCallback((message, duration = 8000) => {
    showToast(message, 'important', duration, true);
  }, [showToast]);

  return {
    toasts,
    showToast,
    removeToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showImportant,
    playNotificationSound
  };
} 