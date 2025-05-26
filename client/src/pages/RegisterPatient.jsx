import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import AnimatedPage from '../components/AnimatedPage';

export default function RegisterPatient() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      const res = await fetch('http://localhost:5000/patient/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (res.ok) {
        setMessage('✅ Compte créé avec succès. Redirection...');
        setTimeout(() => navigate('/login-patient'), 1500);
      } else {
        setError(data.message || 'Erreur lors de l’inscription.');
      }
    } catch (err) {
      setError('Erreur réseau ou serveur.');
    }
  };

  return (
    <Layout>
      <AnimatedPage>
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-lg shadow w-full max-w-sm mx-auto"
        >
          <h2 className="text-lg font-semibold mb-4 text-blue-600 text-center">
            Créer un compte patient
          </h2>

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
            className="w-full border border-gray-300 rounded px-4 py-2 mb-4"
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
            Vous avez déjà un compte ?{' '}
            <a
              href="/login-patient"
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
