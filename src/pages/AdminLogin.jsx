import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminLogin() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const ADMIN_CODE = 'admin2024';

  const handleSubmit = (e) => {
    e.preventDefault();

    if (code === ADMIN_CODE) {
      localStorage.setItem('isAdmin', 'true');
      navigate('/admin');
    } else {
      setError('Code incorrect.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow w-full max-w-sm">
        <h2 className="text-xl font-bold mb-4 text-center">Connexion Admin</h2>

        <input
          type="password"
          placeholder="Code d’accès"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full border border-gray-300 rounded px-4 py-2 mb-4"
        />

        {error && <p className="text-red-600 text-sm mb-2">{error}</p>}

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Se connecter
        </button>
      </form>
    </div>
  );
}
