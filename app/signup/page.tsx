'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Bot } from 'lucide-react';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSignUp = async () => {
    setLoading(true);
    setError('');
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      alert('Vérifiez votre email pour confirmer votre inscription!');
      router.push('/');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-gray-800 p-8 rounded-xl w-96">
        <div className="flex justify-center mb-6">
          <Bot className="w-12 h-12 text-purple-600" />
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-6 text-center">
          Créer votre compte CryptoBot Pro
        </h2>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 mb-4 bg-gray-700 text-white rounded"
        />
        
        <input
          type="password"
          placeholder="Mot de passe (min 6 caractères)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 mb-6 bg-gray-700 text-white rounded"
        />
        
        <button
          onClick={handleSignUp}
          disabled={loading}
          className="w-full bg-purple-600 text-white p-3 rounded hover:bg-purple-700 disabled:opacity-50"
        >
          {loading ? 'Création...' : 'Créer mon compte'}
        </button>
        
        <p className="text-gray-400 text-center mt-4">
          Déjà un compte?{' '}
          <a href="/" className="text-purple-400 hover:underline">
            Se connecter
          </a>
        </p>
      </div>
    </div>
  );
}