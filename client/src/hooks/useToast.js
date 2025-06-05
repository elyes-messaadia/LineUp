import { useState, useCallback } from 'react';

export function useToast() {
  const [toasts, setToasts] = useState([]);

  // Son de notification
  const playNotificationSound = useCallback((type = 'info') => {
    try {
      // Utiliser l'API Web Audio pour créer un bip simple si le fichier n'existe pas
      const createBeep = (frequency = 800, duration = 200) => {
        try {
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.value = frequency;
          oscillator.type = 'sine';
          
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
          
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + duration / 1000);
        } catch (e) {
          // Ignore si l'API audio n'est pas supportée
        }
      };

      // Essayer d'abord le fichier audio, sinon utiliser le fallback
      const audio = new Audio('/notify.mp3');
      audio.volume = type === 'important' ? 1.0 : 0.7;
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Si le fichier n'existe pas ou autres erreurs, utiliser le fallback
          if (type === 'important') {
            createBeep(1000, 300); // Son plus aigu et long pour important
            setTimeout(() => createBeep(800, 200), 100);
          } else {
            createBeep(800, 200); // Son standard
          }
        });
      }

      // Vibration pour les notifications importantes (mobiles)
      if (type === 'important' && 'vibrate' in navigator) {
        navigator.vibrate([300, 100, 300, 100, 300]);
      }
    } catch (error) {
      // Ignore toutes les erreurs audio
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