"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [msg, setMsg] = useState("Connexion en cours…");

  useEffect(() => {
    const run = async () => {
      try {
        const code = searchParams.get("code");

        // ✅ PKCE "code" flow (si Supabase renvoie un code)
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else {
          // ✅ Implicit/token flow: supabase-js lit l'URL (#...) et pose la session
          // detectSessionInUrl=true dans ton client => getSession déclenche la lecture si besoin
          const { error } = await supabase.auth.getSession();
          if (error) throw error;
        }

        setMsg("Connectée. Redirection…");
        router.replace("/dashboard");
      } catch (e: any) {
        console.error(e);
        router.replace("/login?error=callback");
      }
    };

    run();
  }, [router, searchParams]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#e7ebed] px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow text-slate-700">
        {msg}
      </div>
    </main>
  );
}