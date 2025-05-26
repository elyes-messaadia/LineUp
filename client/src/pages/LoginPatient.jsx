import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import AnimatedPage from '../components/AnimatedPage';

export default function LoginPatient() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Connexion patient :', { email, password });
  };

  return (
    <Layout>
      <AnimatedPage>
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-lg shadow w-full"
        >
          <h2 className="text-lg font-semibold mb-4 text-blue-600 text-center">
            Connexion patient
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
            className="w-full border border-gray-300 rounded px-4 py-2 mb-6"
          />

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            Se connecter
          </button>

          <p className="text-sm text-center mt-4 text-gray-500">
            Pas encore de compte ?{' '}
            <a
              href="/register-patient"
              className="text-blue-600 underline hover:text-blue-800"
            >
              Inscrivez-vous ici
            </a>
          </p>
        </form>
      </AnimatedPage>
    </Layout>
  );
}
