'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function BottomNav() {
  const pathname = usePathname();

  const isDashboard = pathname === '/';
  const isHorses = pathname.startsWith('/horses') && !pathname.startsWith('/horses/new');

  const base =
    'text-center rounded-xl px-3 py-3 font-semibold hover:bg-[#e7ebed] transition-colors';
  const active = 'bg-[#e7ebed] text-[#1d5998]';
  const inactive = 'text-[#1d5998]';

  return (
    <nav className="md:hidden fixed left-0 right-0 bottom-4 z-50">
      <div className="mx-auto w-[calc(100%-2rem)] max-w-md rounded-2xl bg-white border border-[#b3bec5]/60 shadow-xl">
        <div className="grid grid-cols-3 gap-2 p-2">
          <Link href="/" className={`${base} ${isDashboard ? active : inactive}`}>
            Dashboard
          </Link>

          <Link href="/horses" className={`${base} ${isHorses ? active : inactive}`}>
            Chevaux
          </Link>

          <Link
            href="/horses/new"
            className="text-center rounded-xl px-3 py-3 font-semibold bg-[#1d5998] text-white transition-colors hover:opacity-95"
          >
            + Ajouter
          </Link>
        </div>
      </div>
    </nav>
  );
}