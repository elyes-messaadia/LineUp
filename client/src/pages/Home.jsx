import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  const handleTicket = async () => {
    const res = await fetch('http://localhost:5000/ticket', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();

    // 🔐 Stocker temporairement le ticket dans localStorage
    localStorage.setItem('lineup_ticket', JSON.stringify(data));

    // Redirection vers la page /ticket
    navigate('/ticket');
  };

  return (
    <div className="p-6 text-center">
      <h1 className="text-xl font-bold mb-4">Bienvenue sur LineUp</h1>
      <button
        onClick={handleTicket}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow hover:bg-blue-700"
      >
        Prendre un ticket
      </button>
    </div>
  );
}
