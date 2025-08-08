import { useState, useEffect, useCallback } from 'react';
import BACKEND_URL from '../config/api';

const VAPID_PUBLIC_KEY = 'BE6TTcnzxhHpEBQTomuclPw9snOauTKkweaL4HnnnatHhUjy_xk8xtMqDHVYhm9PolO19WIuE_M41U7yofhAPA0';

console.log('Push Notifications Hook - Backend URL:', BACKEND_URL);

export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastError, setLastError] = useState(null);

  // Vérifier l'abonnement existant de manière robuste
  const checkExistingSubscription = useCallback(async () => {
    if (!isSupported) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const existingSubscription = await registration.pushManager.getSubscription();
      
      // Mise à jour synchrone des états
      if (existingSubscription) {
        setSubscription(existingSubscription);
        setIsSubscribed(true);
        console.log('✅ Abonnement push détecté:', existingSubscription.endpoint.substring(0, 50) + '...');
      } else {
        setSubscription(null);
        setIsSubscribed(false);
        console.log('ℹ️ Aucun abonnement push actif');
      }
    } catch (error) {
      console.error('❌ Erreur lors de la vérification de l\'abonnement:', error);
      setSubscription(null);
      setIsSubscribed(false);
      setLastError(error.message);
    }
  }, [isSupported]);

  useEffect(() => {
    // Vérifier le support des notifications push
    const checkSupport = () => {
      const supported = 'serviceWorker' in navigator && 
                       'PushManager' in window && 
                       'Notification' in window;
      setIsSupported(supported);
      console.log(`Support notifications push: ${supported ? 'oui' : 'non'}`);
    };

    checkSupport();
  }, []);

  useEffect(() => {
    if (isSupported) {
      checkExistingSubscription();
    }
  }, [isSupported, checkExistingSubscription]);

  // Convertir la clé VAPID en Uint8Array
  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  // S'abonner aux notifications - Version améliorée
  const subscribe = async () => {
    if (!isSupported) {
      const error = 'Les notifications push ne sont pas supportées';
      setLastError(error);
      return { success: false, message: error };
    }

    setIsLoading(true);
    setLastError(null);

    try {
      // Demander la permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        const error = 'Permission refusée pour les notifications';
        setLastError(error);
        return { success: false, message: error };
      }

      // Obtenir le service worker
      const registration = await navigator.serviceWorker.ready;
      
      // Créer l'abonnement
      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      console.log('Nouvel abonnement créé:', newSubscription.endpoint.substring(0, 50) + '...');

      // Envoyer l'abonnement au serveur
      const token = localStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/auth/push/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          subscription: newSubscription.toJSON()
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur serveur: ${response.status} - ${errorText}`);
      }

      // ✅ Mise à jour des états SEULEMENT après succès complet
      setSubscription(newSubscription);
      setIsSubscribed(true);
      
      console.log('✅ Abonnement push activé avec succès');
      return { success: true, message: 'Notifications activées avec succès!' };
    } catch (error) {
      console.error('❌ Erreur lors de l\'abonnement:', error);
      setLastError(error.message);
      
      // En cas d'erreur, s'assurer que les états sont cohérents
      await checkExistingSubscription();
      
      return { success: false, message: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Se désabonner des notifications - Version améliorée et plus robuste
  const unsubscribe = async () => {
    if (!subscription) {
      console.log('⚠️ Aucun abonnement à supprimer');
      return { success: true, message: 'Aucun abonnement actif' };
    }

    setIsLoading(true);
    setLastError(null);

    try {
      // 1. D'abord désabonner côté serveur
      const token = localStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/auth/push/unsubscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur serveur: ${response.status} - ${errorText}`);
      }

      // 2. Ensuite désabonner côté client
      const unsubscribeSuccess = await subscription.unsubscribe();
      console.log('Désabonnement client:', unsubscribeSuccess ? 'ok' : 'échec');

      // 3. ✅ Mise à jour immédiate des états après succès
      setSubscription(null);
      setIsSubscribed(false);
      
      console.log('✅ Notifications désactivées avec succès');
      return { success: true, message: 'Notifications désactivées avec succès' };
    } catch (error) {
      console.error('❌ Erreur lors du désabonnement:', error);
      setLastError(error.message);
      
      // En cas d'erreur, revérifier l'état réel
      await checkExistingSubscription();
      
      return { success: false, message: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour forcer la vérification (utile pour débugger)
  const refreshStatus = useCallback(async () => {
    console.log('Rafraîchissement statut notifications...');
    await checkExistingSubscription();
  }, [checkExistingSubscription]);

  return {
    isSupported,
    isSubscribed,
    isLoading,
    lastError,
    subscription,
    subscribe,
    unsubscribe,
    refreshStatus
  };
}; 