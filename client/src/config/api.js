// Configuration API centralisée - DÉVELOPPEMENT LOCAL
const DEFAULT_LOCAL_API = 'http://localhost:5000';
const ENV_API = import.meta.env.VITE_API_URL;

// Détection d'environnement local étendue (localhost, 127.0.0.1, réseau local)
const hostname = window.location.hostname || '';
const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.local');
const isLocalNetwork = /^192\.168\./.test(hostname) || /^10\./.test(hostname) || /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname);

const BACKEND_URL = (isLocalHost || isLocalNetwork)
  ? (ENV_API || DEFAULT_LOCAL_API)
  : 'https://lineup-backend-xxak.onrender.com';

// Log de configuration API pour debug local
console.log('API Configuration:', { env: ENV_API, hostname, finalURL: BACKEND_URL, mode: import.meta.env.MODE });

export default BACKEND_URL; 