'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

type BirthMode = 'FULL' | 'YEAR';

type HorsePayload = {
  id: string;
  name: string | null;
  affixe: string | null;
  sire: string | null;
  dam: string | null;
  dam_sire: string | null;
  birthdate: string | null; // YYYY-MM-DD
  birth_year: number | null;
};

export default function EditHorsePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const horseId = params?.id;

  // Identité
  const [name, setName] = useState('');
  const [affixe, setAffixe] = useState('');

  // Origines
  const [sire, setSire] = useState('');       // Père
  const [dam, setDam] = useState('');         // Mère
  const [damSire, setDamSire] = useState(''); // Père de la mère

  // Naissance
  const [birthMode, setBirthMode] = useState<BirthMode>('FULL');
  const [birthdate, setBirthdate] = useState(''); // YYYY-MM-DD
  const [birthYear, setBirthYear] = useState(''); // YYYY

  // UI
  const [loading, setLoading] = useState(true);       // chargement initial
  const [saving, setSaving] = useState(false);        // sauvegarde
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fullName = useMemo(() => {
    const n = name.trim();
    const a = affixe.trim();
    return [n, a].filter(Boolean).join(' ');
  }, [name, affixe]);

  // ✅ Pré-remplissage via API (server -> cookies -> RLS OK)
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setError(null);
      setLoading(true);

      if (!horseId || horseId === 'undefined') {
        setError("ID du cheval manquant dans l'URL.");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/horses/get?id=${encodeURIComponent(horseId)}`, {
          method: 'GET',
          cache: 'no-store',
        });

        const json = await res.json();

        if (!res.ok) {
          throw new Error(json?.error || 'Impossible de charger le cheval.');
        }

        const data = json?.horse as HorsePayload | undefined;
        if (!data) throw new Error('Cheval introuvable.');

        if (cancelled) return;

        setName((data.name ?? '').toString());
        setAffixe((data.affixe ?? '').toString());
        setSire((data.sire ?? '').toString());
        setDam((data.dam ?? '').toString());
        setDamSire((data.dam_sire ?? '').toString());

        // naissance : si birthdate existe => FULL, sinon YEAR si birth_year
        const bd = data.birthdate ? String(data.birthdate) : '';
        const by = data.birth_year ? String(data.birth_year) : '';

        if (bd) {
          setBirthMode('FULL');
          setBirthdate(bd);
          setBirthYear('');
        } else if (by) {
          setBirthMode('YEAR');
          setBirthYear(by);
          setBirthdate('');
        } else {
          setBirthMode('FULL');
          setBirthdate('');
          setBirthYear('');
        }

        setLoading(false);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message || 'Impossible de charger le cheval.');
        setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [horseId]);

  const submit = async () => {
    setError(null);
    setSuccess(null);

    if (!horseId || horseId === 'undefined') return setError("ID du cheval manquant dans l'URL.");

    if (!name.trim()) return setError('Le nom est obligatoire.');
    if (!affixe.trim()) return setError("L'affixe est obligatoire.");

    if (birthMode === 'FULL') {
      if (!birthdate) return setError('La date de naissance est obligatoire (mode date complète).');
    } else {
      const y = Number(birthYear);
      const max = new Date().getFullYear();
      if (!birthYear || Number.isNaN(y) || y < 1900 || y > max) {
        return setError("L'année de naissance est invalide.");
      }
    }

    setSaving(true);
    try {
      const res = await fetch('/api/horses/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: horseId,
          name: name.trim(),
          affixe: affixe.trim(),
          sire: sire.trim() || null,
          dam: dam.trim() || null,
          dam_sire: damSire.trim() || null,
          birthdate: birthMode === 'FULL' ? birthdate : null,
          birth_year: birthMode === 'YEAR' ? Number(birthYear) : null,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Erreur lors de la mise à jour.');

      setSuccess('Modifications enregistrées ✅ Redirection…');
      setTimeout(() => {
        router.push(`/horses/${horseId}`);
        router.refresh();
      }, 700);
    } catch (e: any) {
      setError(e?.message || "Erreur : la modification n'a pas abouti.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#e7ebed] text-slate-900" translate="no">
      <div className="px-4 sm:px-6 lg:px-10 py-6 sm:py-10 pb-[calc(10rem+env(safe-area-inset-bottom))] md:pb-10 max-w-3xl">
        {/* Top */}
        <div className="flex items-start sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1d5998]">
              Modifier le cheval
            </h1>
            <p className="text-slate-600 mt-1">
              Identité · Origines · Naissance
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
            disabled={loading || saving || !!success}
            className="rounded-xl bg-[#1d5998] px-4 py-2 font-semibold text-white hover:opacity-95 disabled:opacity-60"
          >
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>

        {loading && (
          <div className="mt-4 rounded-xl border border-[#b3bec5]/60 bg-white px-4 py-3 text-slate-700">
            Chargement…
          </div>
        )}

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

        {/* Form */}
        {!loading && (
          <>
            {/* Identité */}
            <section className="mt-6 rounded-2xl bg-white border border-[#b3bec5]/60 shadow-sm p-5 sm:p-6">
              <h2 className="text-xl font-extrabold text-slate-900">Identité</h2>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700">Nom (obligatoire)</label>
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    disabled={!!success}
                    className="mt-1 w-full rounded-xl border border-[#b3bec5]/60 px-3 py-2 outline-none focus:ring-2 focus:ring-[#1d5998]/30 disabled:opacity-60"
                    placeholder="Ex : Habana"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700">Affixe (obligatoire)</label>
                  <input
                    value={affixe}
                    onChange={e => setAffixe(e.target.value)}
                    disabled={!!success}
                    className="mt-1 w-full rounded-xl border border-[#b3bec5]/60 px-3 py-2 outline-none focus:ring-2 focus:ring-[#1d5998]/30 disabled:opacity-60"
                    placeholder="Ex : du Moulon"
                  />
                </div>

                <div className="sm:col-span-2 text-sm text-slate-600">
                  Nom complet : <span className="font-semibold text-slate-900">{fullName || '—'}</span>
                </div>
              </div>
            </section>

            {/* Origines */}
            <section className="mt-6 rounded-2xl bg-white border border-[#b3bec5]/60 shadow-sm p-5 sm:p-6">
              <h2 className="text-xl font-extrabold text-slate-900">Origines</h2>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700">Père</label>
                  <input
                    value={sire}
                    onChange={e => setSire(e.target.value)}
                    disabled={!!success}
                    className="mt-1 w-full rounded-xl border border-[#b3bec5]/60 px-3 py-2 outline-none focus:ring-2 focus:ring-[#1d5998]/30 disabled:opacity-60"
                    placeholder="Nom du père"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700">Mère</label>
                  <input
                    value={dam}
                    onChange={e => setDam(e.target.value)}
                    disabled={!!success}
                    className="mt-1 w-full rounded-xl border border-[#b3bec5]/60 px-3 py-2 outline-none focus:ring-2 focus:ring-[#1d5998]/30 disabled:opacity-60"
                    placeholder="Nom de la mère"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700">Père de la mère</label>
                  <input
                    value={damSire}
                    onChange={e => setDamSire(e.target.value)}
                    disabled={!!success}
                    className="mt-1 w-full rounded-xl border border-[#b3bec5]/60 px-3 py-2 outline-none focus:ring-2 focus:ring-[#1d5998]/30 disabled:opacity-60"
                    placeholder="Nom du père de la mère"
                  />
                </div>
              </div>
            </section>

            {/* Naissance */}
            <section className="mt-6 rounded-2xl bg-white border border-[#b3bec5]/60 shadow-sm p-5 sm:p-6">
              <h2 className="text-xl font-extrabold text-slate-900">Naissance</h2>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setBirthMode('FULL')}
                  disabled={!!success}
                  className={`rounded-xl px-4 py-2 font-semibold border ${
                    birthMode === 'FULL'
                      ? 'bg-[#1d5998] text-white border-[#1d5998]'
                      : 'bg-white text-[#1d5998] border-[#b3bec5]/60'
                  } disabled:opacity-60`}
                >
                  Date complète
                </button>

                <button
                  type="button"
                  onClick={() => setBirthMode('YEAR')}
                  disabled={!!success}
                  className={`rounded-xl px-4 py-2 font-semibold border ${
                    birthMode === 'YEAR'
                      ? 'bg-[#1d5998] text-white border-[#1d5998]'
                      : 'bg-white text-[#1d5998] border-[#b3bec5]/60'
                  } disabled:opacity-60`}
                >
                  Année seulement
                </button>
              </div>

              <div className="mt-4">
                {birthMode === 'FULL' ? (
                  <div className="max-w-xs">
                    <label className="text-sm font-semibold text-slate-700">Date de naissance</label>
                    <input
                      type="date"
                      value={birthdate}
                      onChange={e => setBirthdate(e.target.value)}
                      disabled={!!success}
                      className="mt-1 w-full rounded-xl border border-[#b3bec5]/60 px-3 py-2 outline-none focus:ring-2 focus:ring-[#1d5998]/30 disabled:opacity-60"
                    />
                  </div>
                ) : (
                  <div className="max-w-xs">
                    <label className="text-sm font-semibold text-slate-700">Année de naissance</label>
                    <input
                      inputMode="numeric"
                      value={birthYear}
                      onChange={e => setBirthYear(e.target.value.replace(/[^\d]/g, '').slice(0, 4))}
                      disabled={!!success}
                      className="mt-1 w-full rounded-xl border border-[#b3bec5]/60 px-3 py-2 outline-none focus:ring-2 focus:ring-[#1d5998]/30 disabled:opacity-60"
                      placeholder="Ex : 2021"
                    />
                  </div>
                )}
              </div>
            </section>

            <div className="mt-6 flex justify-end gap-3">
              <Link
                href={`/horses/${horseId}`}
                className="rounded-xl bg-white px-5 py-3 font-extrabold text-[#1d5998] border border-[#b3bec5]/60 hover:bg-[#e7ebed]"
              >
                Annuler
              </Link>

              <button
                onClick={submit}
                disabled={saving || !!success}
                className="rounded-xl bg-[#1d5998] px-5 py-3 font-extrabold text-white hover:opacity-95 disabled:opacity-60"
              >
                {saving ? 'Enregistrement…' : 'Enregistrer les modifications'}
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}