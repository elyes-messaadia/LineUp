// Configuration API centralisée - FIX URGENT PRODUCTION
const API_URL = import.meta.env.VITE_API_URL || 'https://lineup-backend-xxak.onrender.com';

// FORCE la bonne URL en production
const BACKEND_URL = process.env.NODE_ENV === 'production' || window.location.hostname !== 'localhost'
  ? 'https://lineup-backend-xxak.onrender.com'
  : API_URL;

console.log('🔧 API Configuration:', { 
  env: import.meta.env.VITE_API_URL, 
  hostname: window.location.hostname,
  finalURL: BACKEND_URL,
  mode: import.meta.env.MODE 
});

export default BACKEND_URL; 