import { useState, useCallback, useRef } from 'react';

export function useToast() {
  const [toasts, setToasts] = useState([]);
  const audioContextRef = useRef(null);
  const isAudioInitializedRef = useRef(false);

  // Initialiser l'AudioContext après interaction utilisateur
  const initializeAudio = useCallback(() => {
    if (isAudioInitializedRef.current) return true;
    
    try {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      
      // Reprendre le contexte s'il est suspendu
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
      
      isAudioInitializedRef.current = true;
      console.log('🔊 Audio initialisé avec succès');
      return true;
    } catch (e) {
      console.warn('❌ Impossible d\'initialiser l\'audio:', e);
      return false;
    }
  }, []);

  // Son de notification
  const playNotificationSound = useCallback((type = 'info') => {
    console.log(`🔊 Tentative de lecture du son: ${type}`);
    
    try {
      // Essayer d'initialiser l'audio si pas encore fait
      if (!initializeAudio()) {
        console.warn('❌ Audio non initialisé');
        return;
      }

      const audioContext = audioContextRef.current;
      if (!audioContext || audioContext.state === 'closed') {
        console.warn('❌ AudioContext non disponible');
        return;
      }

      // Reprendre le contexte s'il est suspendu
      if (audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
          playNotificationSound(type); // Réessayer après reprise
        });
        return;
      }

      // Créer un beep avec l'AudioContext
      const createBeep = (frequency = 800, duration = 200, volume = 0.3) => {
        try {
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
          
          console.log(`✅ Beep joué: ${frequency}Hz, ${duration}ms`);
        } catch (e) {
          console.warn('❌ Erreur lors de la création du beep:', e);
        }
      };

      // Sons différents selon le type
      console.log(`🎵 Lecture du son de type: ${type}`);
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
        console.log('📳 Vibration activée');
      }
    } catch (error) {
      console.warn('❌ Erreur audio globale:', error);
    }
  }, [initializeAudio]);

  const showToast = useCallback((message, type = 'info', duration = 3000, playSound = false) => {
    const id = Date.now() + Math.random();
    const newToast = { id, message, type, duration };
    
    setToasts(prev => [...prev, newToast]);
    console.log(`📢 Toast affiché: ${message} (son: ${playSound})`);
    
    // Jouer le son si demandé
    if (playSound) {
      // Délai pour éviter les problèmes de timing
      setTimeout(() => {
        playNotificationSound(type);
      }, 100);
    }
    
    // Auto-remove après la durée spécifiée
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, duration + 300); // +300ms pour l'animation
  }, [playNotificationSound]);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const showSuccess = useCallback((message, duration = 3000, playSound = false) => {
    console.log(`✅ Success toast: ${message}`);
    showToast(message, 'success', duration, playSound);
  }, [showToast]);

  const showError = useCallback((message, duration = 5000, playSound = true) => {
    console.log(`❌ Error toast: ${message}`);
    showToast(message, 'error', duration, playSound);
  }, [showToast]);

  const showWarning = useCallback((message, duration = 4000, playSound = true) => {
    console.log(`⚠️ Warning toast: ${message}`);
    showToast(message, 'warning', duration, playSound);
  }, [showToast]);

  const showInfo = useCallback((message, duration = 3000, playSound = false) => {
    console.log(`ℹ️ Info toast: ${message}`);
    showToast(message, 'info', duration, playSound);
  }, [showToast]);

  // Notification spéciale pour les changements de statut critiques
  const showImportant = useCallback((message, duration = 8000) => {
    console.log(`🚨 Important toast: ${message}`);
    showToast(message, 'important', duration, true);
  }, [showToast]);

  // Fonction pour tester le son manuellement
  const testSound = useCallback((type = 'info') => {
    console.log('🔧 Test manuel du son...');
    initializeAudio();
    playNotificationSound(type);
  }, [initializeAudio, playNotificationSound]);

  return {
    toasts,
    showToast,
    removeToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showImportant,
    playNotificationSound,
    testSound,
    initializeAudio
  };
} 