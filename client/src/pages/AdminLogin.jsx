import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import AnimatedPage from '../components/AnimatedPage';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch('http://localhost:5000/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('isAdmin', 'true');
        localStorage.setItem('adminId', data.adminId);
        navigate('/admin');
      } else {
        setError(data.message || 'Identifiants incorrects.');
      }
    } catch (err) {
      setError('Erreur serveur. Veuillez réessayer.');
    }
  };

  return (
    <Layout>
      <AnimatedPage>
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-lg shadow w-full max-w-sm mx-auto"
        >
          <h2 className="text-lg font-bold mb-4 text-center text-blue-700">
            Connexion Admin
          </h2>

          <input
            type="email"
            placeholder="Adresse e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 rounded px-4 py-2 mb-4"
          />

          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-300 rounded px-4 py-2 mb-4"
          />

          {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            Se connecter
          </button>
        </form>
      </AnimatedPage>
    </Layout>
  );
}
