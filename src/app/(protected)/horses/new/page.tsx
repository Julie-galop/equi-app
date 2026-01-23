'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type VaccType = 'GRIPPE' | 'RHINO';
type VaccRow = { type: VaccType; date: string };

export default function NewHorsePage() {
  const router = useRouter();

  // ✅ Nom + Affixe (dans cet ordre)
  const [name, setName] = useState('');
  const [affixe, setAffixe] = useState('');

  // Origines
  const [sire, setSire] = useState('');       // Père
  const [dam, setDam] = useState('');         // Mère
  const [damSire, setDamSire] = useState(''); // Père de la mère

  // Naissance
  const [birthMode, setBirthMode] = useState<'FULL' | 'YEAR'>('FULL');
  const [birthdate, setBirthdate] = useState(''); // YYYY-MM-DD
  const [birthYear, setBirthYear] = useState(''); // YYYY

  // Vaccinations précédentes
  const [vaccinations, setVaccinations] = useState<VaccRow[]>([]);

  // UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // ✅ Nom complet : "Habana du Moulon"
  const fullName = useMemo(() => {
    const n = name.trim();
    const a = affixe.trim();
    return [n, a].filter(Boolean).join(' ');
  }, [name, affixe]);

  const addVacc = () =>
    setVaccinations(v => [...v, { type: 'GRIPPE', date: '' }]);

  const updateVacc = (i: number, patch: Partial<VaccRow>) => {
    setVaccinations(v =>
      v.map((row, idx) => (idx === i ? { ...row, ...patch } : row))
    );
  };

  const isVaccRowEmpty = (row: VaccRow) => !row.date;

  const removeVacc = (i: number) => {
    const row = vaccinations[i];
    if (!row) return;

    // ✅ si vide : suppression sans confirmation
    if (isVaccRowEmpty(row)) {
      setVaccinations(v => v.filter((_, idx) => idx !== i));
      return;
    }

    const ok = window.confirm('Supprimer cette ligne de vaccination ?');
    if (!ok) return;

    setVaccinations(v => v.filter((_, idx) => idx !== i));
  };

  const submit = async () => {
    setError(null);
    setSuccess(null);

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

    // ✅ si des lignes vaccins existent, la date doit être remplie
    for (const [idx, v] of vaccinations.entries()) {
      if (!v.date) return setError(`Date manquante pour la vaccination #${idx + 1}.`);
    }

    setLoading(true);

    try {
      const res = await fetch('/api/horses/create', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          affixe: affixe.trim(),
          name: name.trim(),
          sire: sire.trim() || null,
          dam: dam.trim() || null,
          damSire: damSire.trim() || null,
          birthMode,
          birthdate: birthMode === 'FULL' ? birthdate : null,
          birthYear: birthMode === 'YEAR' ? Number(birthYear) : null,
          vaccinations,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Erreur lors de la création.');

      setSuccess('Cheval ajouté avec succès ✅ Redirection…');
      setTimeout(() => {
        router.push('/horses');
        router.refresh();
      }, 900);
    } catch (e: any) {
      setError(e?.message || "Erreur : l'ajout n'a pas abouti.");
    } finally {
      setLoading(false);
    }
  };

  return (
    // ✅ anti-traduction (Chrome) : limite fortement "Économiser" / "Rhinocéros"
    <main className="min-h-screen bg-[#e7ebed] text-slate-900" translate="no">
      {/* ✅ plus de padding spécial bottom-nav */}
      <div className="px-4 sm:px-6 lg:px-10 py-6 sm:py-10 max-w-3xl">
        <div className="flex items-start sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1d5998]">
              Ajouter un cheval
            </h1>
            <p className="text-slate-600 mt-1">
              Identité · Origines · Naissance · Vaccinations
            </p>

            <div className="mt-3">
              <Link
                href="/horses"
                className="inline-flex items-center rounded-xl border border-[#b3bec5]/60 bg-white px-3 py-2 font-semibold text-[#1d5998] hover:bg-[#e7ebed]"
              >
                ← Retour à la liste
              </Link>
            </div>
          </div>

          <button
            onClick={submit}
            disabled={loading || !!success}
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

        {/* Identité */}
        <section className="mt-6 rounded-2xl bg-white border border-[#b3bec5]/60 shadow-sm p-5 sm:p-6">
          <h2 className="text-xl font-extrabold text-slate-900">Identité</h2>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-slate-700">Nom (obligatoire)</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#b3bec5]/60 px-3 py-2 outline-none focus:ring-2 focus:ring-[#1d5998]/30"
                placeholder="Ex : Habana"
                disabled={!!success}
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">Affixe (obligatoire)</label>
              <input
                value={affixe}
                onChange={e => setAffixe(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#b3bec5]/60 px-3 py-2 outline-none focus:ring-2 focus:ring-[#1d5998]/30"
                placeholder="Ex : du Moulon"
                disabled={!!success}
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
                className="mt-1 w-full rounded-xl border border-[#b3bec5]/60 px-3 py-2 outline-none focus:ring-2 focus:ring-[#1d5998]/30"
                placeholder="Nom du père"
                disabled={!!success}
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">Mère</label>
              <input
                value={dam}
                onChange={e => setDam(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#b3bec5]/60 px-3 py-2 outline-none focus:ring-2 focus:ring-[#1d5998]/30"
                placeholder="Nom de la mère"
                disabled={!!success}
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">Père de la mère</label>
              <input
                value={damSire}
                onChange={e => setDamSire(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#b3bec5]/60 px-3 py-2 outline-none focus:ring-2 focus:ring-[#1d5998]/30"
                placeholder="Nom du père de la mère"
                disabled={!!success}
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
                  className="mt-1 w-full rounded-xl border border-[#b3bec5]/60 px-3 py-2 outline-none focus:ring-2 focus:ring-[#1d5998]/30"
                  disabled={!!success}
                />
              </div>
            ) : (
              <div className="max-w-xs">
                <label className="text-sm font-semibold text-slate-700">Année de naissance</label>
                <input
                  inputMode="numeric"
                  value={birthYear}
                  onChange={e => setBirthYear(e.target.value.replace(/[^\d]/g, '').slice(0, 4))}
                  className="mt-1 w-full rounded-xl border border-[#b3bec5]/60 px-3 py-2 outline-none focus:ring-2 focus:ring-[#1d5998]/30"
                  placeholder="Ex : 2021"
                  disabled={!!success}
                />
              </div>
            )}
          </div>
        </section>

        {/* Vaccinations précédentes */}
        <section className="mt-6 rounded-2xl bg-white border border-[#b3bec5]/60 shadow-sm p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-extrabold text-slate-900">Vaccinations précédentes</h2>
            <button
              type="button"
              onClick={addVacc}
              disabled={!!success}
              className="rounded-xl bg-[#e7ebed] px-3 py-2 font-semibold text-[#1d5998] hover:opacity-90 disabled:opacity-60"
            >
              + Ajouter une ligne
            </button>
          </div>

          {vaccinations.length === 0 ? (
            <p className="mt-3 text-slate-600">Aucune vaccination renseignée.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {vaccinations.map((v, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-[#b3bec5]/60 bg-[#e7ebed]/40 p-4 flex flex-col sm:flex-row gap-3 sm:items-end"
                >
                  <div className="flex-1">
                    <label className="text-sm font-semibold text-slate-700">Type</label>
                    <select
                      value={v.type}
                      onChange={e => updateVacc(idx, { type: e.target.value as VaccType })}
                      disabled={!!success}
                      className="mt-1 w-full rounded-xl border border-[#b3bec5]/60 px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-[#1d5998]/30 disabled:opacity-60"
                    >
                      <option value="GRIPPE" translate="no">Grippe</option>
                      <option value="RHINO" translate="no">Rhino</option>
                    </select>
                  </div>

                  <div className="flex-1">
                    <label className="text-sm font-semibold text-slate-700">Date</label>
                    <input
                      type="date"
                      value={v.date}
                      onChange={e => updateVacc(idx, { date: e.target.value })}
                      disabled={!!success}
                      className="mt-1 w-full rounded-xl border border-[#b3bec5]/60 px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-[#1d5998]/30 disabled:opacity-60"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => removeVacc(idx)}
                    disabled={!!success}
                    className="rounded-xl bg-white px-3 py-2 font-semibold text-slate-700 border border-[#b3bec5]/60 hover:bg-[#e7ebed] disabled:opacity-60"
                  >
                    Supprimer
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="mt-6 flex justify-end gap-3">
          <Link
            href="/horses"
            className="rounded-xl bg-white px-5 py-3 font-extrabold text-[#1d5998] border border-[#b3bec5]/60 hover:bg-[#e7ebed]"
          >
            Retour
          </Link>

          <button
            onClick={submit}
            disabled={loading || !!success}
            className="rounded-xl bg-[#1d5998] px-5 py-3 font-extrabold text-white hover:opacity-95 disabled:opacity-60"
          >
            {loading ? 'Enregistrement…' : 'Enregistrer le cheval'}
          </button>
        </div>
      </div>
    </main>
  );
}