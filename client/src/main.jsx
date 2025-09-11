import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import App from './App.jsx';
import './index.css';

const root = createRoot(document.getElementById('root'));

root.render(
  <BrowserRouter 
    future={{
      v7_startTransition: true,
      v7_relativeSplatPath: true
    }}
  >
    <AuthProvider>
      <App />
    </AuthProvider>
  </BrowserRouter>
);
