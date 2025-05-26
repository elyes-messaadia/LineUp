import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Title from '../components/Title';

export default function Ticket() {
  const [ticket, setTicket] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem('lineup_ticket');
    if (stored) {
      setTicket(JSON.parse(stored));
    }
  }, []);

  const handleCancel = async () => {
    if (!ticket) return;

    await fetch(`http://localhost:5000/ticket/${ticket.id}`, {
      method: 'DELETE'
    });

    localStorage.removeItem('lineup_ticket');
    navigate('/');
  };

  if (!ticket) {
    return <p className="p-6">Aucun ticket trouvé.</p>;
  }

  return (
    <div className="p-6 text-center">
      <Title left="Votre ticket est enregistré :" right={`n°${ticket.number}`} emoji="🎫" />

      <p>Heure d’enregistrement : {new Date(ticket.createdAt).toLocaleTimeString()}</p>

      <button
        onClick={handleCancel}
        className="mt-6 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
      >
        Annuler mon ticket
      </button>
    </div>
  );
}
