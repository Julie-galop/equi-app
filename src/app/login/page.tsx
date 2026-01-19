'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMagicLink = async () => {
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }

    setLoading(false);
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#e7ebed] px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow">
        <h1 className="text-2xl font-extrabold text-[#1d5998]">
          Connexion
        </h1>

        <p className="mt-2 text-slate-600">
          Entrez votre adresse email pour recevoir un lien de connexion.
        </p>

        {sent ? (
          <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-700">
            📧 Un lien de connexion vient de vous être envoyé.
            <br />
            Pensez à vérifier vos spams.
          </div>
        ) : (
          <>
            <input
              type="email"
              placeholder="email@exemple.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="mt-4 w-full rounded-xl border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-[#1d5998]/30 outline-none"
            />

            {error && (
              <div className="mt-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              onClick={sendMagicLink}
              disabled={loading || !email}
              className="mt-4 w-full rounded-xl bg-[#1d5998] px-4 py-2 font-extrabold text-white disabled:opacity-50"
            >
              {loading ? 'Envoi…' : 'Recevoir le lien'}
            </button>
          </>
        )}
      </div>
    </main>
  );
}