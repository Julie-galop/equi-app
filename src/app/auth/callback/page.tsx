'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const finalize = async () => {
      // Sur certains flows, Supabase a besoin d'échanger le "code" contre une session
      const url = new URL(window.location.href);
      const code = url.searchParams.get('code');

      if (code) {
        await supabase.auth.exchangeCodeForSession(code);
      }

      // Ensuite on vérifie qu'on a bien une session
      const { data } = await supabase.auth.getSession();

      // Redirige où tu veux après login
      router.replace(data.session ? '/' : '/login');
      router.refresh();
    };

    finalize();
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#e7ebed]">
      <div className="rounded-2xl bg-white border border-[#b3bec5]/60 shadow-sm p-6 text-slate-700">
        Connexion en cours…
      </div>
    </main>
  );
}