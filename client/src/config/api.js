// Configuration API centralisée - FORCER LOCALHOST EN DEV
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const isViteDev = import.meta.env.MODE === 'development';

console.log('🔧 Mode détection:', {
  hostname: window.location.hostname,
  viteDev: isViteDev,
  isDev: isDevelopment,
  viteEnv: import.meta.env.VITE_API_URL
});

// FORCER localhost si on est en développement
const BACKEND_URL = isDevelopment || isViteDev
  ? 'http://localhost:5000'
  : 'https://lineup-backend-xxak.onrender.com';

console.log('🎯 API URL sélectionnée:', BACKEND_URL);

export default BACKEND_URL; 