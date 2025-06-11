// Configuration API centralisée - DÉVELOPPEMENT LOCAL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// FORCE l'utilisation du serveur local en développement
const BACKEND_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:5000'
  : 'https://lineup-backend-xxak.onrender.com';

console.log('🔧 API Configuration:', { 
  env: import.meta.env.VITE_API_URL, 
  hostname: window.location.hostname,
  finalURL: BACKEND_URL,
  mode: import.meta.env.MODE 
});

export default BACKEND_URL; 