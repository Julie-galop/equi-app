'use client';

import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useMemo, useState } from 'react';

type VaccType = 'GRIPPE' | 'RHINO';

export default function NewVaccinationPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const horseId = params?.id;

  const [type, setType] = useState<VaccType>('GRIPPE');
  const [date, setDate] = useState(''); // YYYY-MM-DD
  const [note, setNote] = useState(''); // optionnel

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return !!horseId && horseId !== 'undefined' && !!date && !loading && !success;
  }, [horseId, date, loading, success]);

  const submit = async () => {
    setError(null);
    setSuccess(null);

    if (!horseId || horseId === 'undefined') return setError("ID du cheval manquant dans l'URL.");
    if (!date) return setError('La date est obligatoire.');

    setLoading(true);
    try {
      const res = await fetch('/api/vaccinations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          horse_id: horseId, // ✅ IMPORTANT: l’API attend horse_id
          type,
          date, // YYYY-MM-DD
          note: note.trim() || null, // ✅ optionnel
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Erreur lors de la création.');

      setSuccess('Vaccin ajouté ✅ Redirection…');
      setTimeout(() => {
        router.push(`/horses/${horseId}`);
        router.refresh();
      }, 700);
    } catch (e: any) {
      setError(e?.message || "Erreur : l'ajout n'a pas abouti.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#e7ebed] text-slate-900" translate="no">
      {/* réserve bas pour la bottom nav */}
      <div className="px-4 sm:px-6 lg:px-10 py-6 sm:py-10 pb-[calc(10rem+env(safe-area-inset-bottom))] md:pb-10 max-w-3xl">
        <div className="flex items-start sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1d5998]">
              Ajouter un vaccin
            </h1>
            <p className="text-slate-600 mt-1">
              Pour ce cheval (ID : <span className="font-mono">{horseId ?? '—'}</span>)
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href={`/horses/${horseId}`}
                className="inline-flex items-center rounded-xl border border-[#b3bec5]/60 bg-white px-3 py-2 font-semibold text-[#1d5998] hover:bg-[#e7ebed]"
              >
                ← Retour fiche
              </Link>
              <Link
                href="/horses"
                className="inline-flex items-center rounded-xl border border-[#b3bec5]/60 bg-white px-3 py-2 font-semibold text-[#1d5998] hover:bg-[#e7ebed]"
              >
                ← Liste chevaux
              </Link>
            </div>
          </div>

          <button
            onClick={submit}
            disabled={!canSubmit}
            className="rounded-xl bg-[#1d5998] px-4 py-2 font-semibold text-white hover:opacity-95 disabled:opacity-60"
          >
            {loading ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>

        {success && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800">
            {success}
          </div>
        )}
        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {error}
          </div>
        )}

        <section className="mt-6 rounded-2xl bg-white border border-[#b3bec5]/60 shadow-sm p-5 sm:p-6">
          <h2 className="text-xl font-extrabold text-slate-900">Détails</h2>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-slate-700">Type</label>
              <select
                value={type}
                onChange={e => setType(e.target.value as VaccType)}
                disabled={!!success}
                className="mt-1 w-full rounded-xl border border-[#b3bec5]/60 px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-[#1d5998]/30 disabled:opacity-60"
              >
                <option value="GRIPPE">Grippe</option>
                <option value="RHINO">Rhino</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">Date</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                disabled={!!success}
                className="mt-1 w-full rounded-xl border border-[#b3bec5]/60 px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-[#1d5998]/30 disabled:opacity-60"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-sm font-semibold text-slate-700">Note (optionnel)</label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                disabled={!!success}
                rows={3}
                className="mt-1 w-full rounded-xl border border-[#b3bec5]/60 px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-[#1d5998]/30 disabled:opacity-60"
                placeholder="Ex : rappel fait par le véto, lot vaccin, remarque…"
              />
            </div>
          </div>

          <div className="mt-4 text-sm text-slate-600">
            Le type est enregistré en base en <span className="font-semibold">GRIPPE</span> ou{' '}
            <span className="font-semibold">RHINO</span>.
          </div>
        </section>
      </div>
    </main>
  );
}