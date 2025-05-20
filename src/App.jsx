import { Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import Ticket from './pages/Ticket';
import Queue from './pages/Queue';

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
      </Routes>
    </div>
  );
}

export default App;
