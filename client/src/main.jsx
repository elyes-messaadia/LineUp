import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { BrowserRouter } from 'react-router-dom';

const root = createRoot(document.getElementById('root'));

root.render(
  <BrowserRouter 
    future={{
      v7_startTransition: true,
      v7_relativeSplatPath: true
    }}
  >
    <App />
  </BrowserRouter>
);
