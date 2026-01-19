"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [msg, setMsg] = useState("Connexion en cours…");

  useEffect(() => {
    const run = async () => {
      try {
        // Lit l'URL courante (y compris querystring)
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else {
          // Implicit/token flow : supabase-js détecte la session dans l'URL si besoin
          const { error } = await supabase.auth.getSession();
          if (error) throw error;
        }

        setMsg("Connectée. Redirection…");
        router.replace("/dashboard");
      } catch (e) {
        console.error(e);
        router.replace("/login?error=callback");
      }
    };

    run();
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#e7ebed] px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow text-slate-700">
        {msg}
      </div>
    </main>
  );
}