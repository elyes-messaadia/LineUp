// Configuration API centralisée - FIX URGENT
const API_URL = import.meta.env.VITE_API_URL || (
  import.meta.env.MODE === 'development' 
    ? 'http://localhost:5000' 
    : 'https://lineup-backend-xxak.onrender.com'
);

// FORCE la bonne URL en production
const BACKEND_URL = import.meta.env.MODE === 'production' 
  ? 'https://lineup-backend-xxak.onrender.com'
  : API_URL;

console.log('🔧 API Configuration:', { 
  env: import.meta.env.VITE_API_URL, 
  forced: BACKEND_URL,
  mode: import.meta.env.MODE,
  isDev: import.meta.env.MODE === 'development'
});

export default BACKEND_URL; 