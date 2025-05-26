import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import AnimatedPage from '../components/AnimatedPage';

export default function RegisterAdmin() {
  const [name, setName] = useState(''); // on ne l'envoie pas au back mais on peut le garder pour l'UI
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      const res = await fetch('http://localhost:5000/admin/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage('✅ Compte créé avec succès ! Redirection...');
        setTimeout(() => navigate('/admin-login'), 1500);
      } else {
        setError(data.message || 'Erreur lors de l’inscription');
      }
    } catch (err) {
      setError('Erreur serveur ou réseau');
    }
  };

  return (
    <Layout>
      <AnimatedPage>
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-lg shadow w-full"
        >
          <h2 className="text-lg font-semibold mb-4 text-blue-600 text-center">
            Créer un compte admin
          </h2>

          <input
            type="text"
            placeholder="Nom complet"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-300 rounded px-4 py-2 mb-4"
          />

          <input
            type="email"
            placeholder="Adresse e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 rounded px-4 py-2 mb-4"
            required
          />

          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-300 rounded px-4 py-2 mb-6"
            required
          />

          {message && <p className="text-green-600 text-sm mb-4">{message}</p>}
          {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

          <button
            type="submit"
            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
          >
            Créer mon compte
          </button>

          <p className="text-sm text-center mt-4 text-gray-500">
            Déjà un compte ?{' '}
            <a
              href="/admin-login"
              className="text-blue-600 underline hover:text-blue-800"
            >
              Connectez-vous ici
            </a>
          </p>
        </form>
      </AnimatedPage>
    </Layout>
  );
}
