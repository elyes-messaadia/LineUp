// Configuration API centralisée - FORCE ABSOLUE LOCALHOST
// FORCER LOCALHOST EN DÉVELOPPEMENT - PAS DE CONDITION
const BACKEND_URL = 'http://localhost:5000';

console.log('🔧 API Configuration:', { 
  hostname: window.location.hostname,
  mode: import.meta.env.MODE,
  forcedURL: BACKEND_URL,
  notice: '🚨 LOCALHOST FORCÉ POUR DEBUG'
});

export default BACKEND_URL; 