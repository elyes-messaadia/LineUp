import { Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import Ticket from './pages/Ticket';
import Queue from './pages/Queue';
import AdminLogin from './pages/AdminLogin';
import Admin from './pages/Admin';

function App() {
  return (
    <div>
      <nav className="p-4 bg-blue-600 text-white flex justify-between">
        <Link to="/">Accueil</Link>
        <Link to="/ticket">Ticket</Link>
        <Link to="/queue">File</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/ticket" element={<Ticket />} />
        <Route path="/queue" element={<Queue />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </div>
  );
}

export default App;
