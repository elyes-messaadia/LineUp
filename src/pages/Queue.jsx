import { useEffect, useState } from 'react';

export default function Queue() {
  const [queue, setQueue] = useState([]);
  const [myId, setMyId] = useState(null);

  useEffect(() => {
    const ticket = localStorage.getItem('lineup_ticket');
    if (ticket) {
      const parsed = JSON.parse(ticket);
      setMyId(parsed.id);
    }

    const fetchQueue = async () => {
      const res = await fetch('http://localhost:5000/queue');
      const data = await res.json();
      setQueue(data);
    };

    fetchQueue();
    const interval = setInterval(fetchQueue, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col min-h-screen p-6">
      <h1 className="text-xl font-bold text-blue-600 mb-4">🕐 File d’attente</h1>

      <ul className="space-y-2">
        {queue.map((t, index) => (
          <li
            key={t.id}
            className={`p-3 rounded-lg shadow-sm ${
              t.id === myId ? 'bg-yellow-100 font-semibold' : 'bg-white'
            }`}
          >
            #{t.number} –{' '}
            {t.status === 'desiste'
              ? 'Désisté'
              : index === 0
              ? 'En consultation'
              : 'En attente'}{' '}
            {t.id === myId && '(vous)'}
          </li>
        ))}
      </ul>

      <div className="mt-auto text-center text-sm text-gray-400 pt-6">
        Accès personnel médical ?{' '}
        <a href="/admin-login" className="underline hover:text-blue-500">
          Connexion admin
        </a>
      </div>
    </div>
  );
}
