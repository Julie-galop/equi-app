'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';

type VaccType = 'GRIPPE' | 'RHINO';
type VaccRow = { id: string; type: VaccType; date: string };

function safeFormatDate(d?: string | null) {
  if (!d) return '—';
  try {
    return format(parseISO(d), 'dd/MM/yyyy');
  } catch {
    return '—';
  }
}

function doseLabel(doseIndex: number) {
  if (doseIndex === 1) return 'Primo 1';
  if (doseIndex === 2) return 'Primo 2';
  if (doseIndex === 3) return 'Primo 3';
  return `Rappel ${doseIndex - 3}`;
}

function group(vaccs: VaccRow[]) {
  const grippe = vaccs
    .filter(v => v.type === 'GRIPPE')
    .sort((a, b) => (a.date > b.date ? -1 : 1)); // DESC

  const rhino = vaccs
    .filter(v => v.type === 'RHINO')
    .sort((a, b) => (a.date > b.date ? -1 : 1)); // DESC

  return { grippe, rhino };
}

export default function VaccHistoryClient({
  horseId,
  initialVaccinations,
}: {
  horseId: string;
  initialVaccinations: VaccRow[];
}) {
  const router = useRouter();

  const [vaccs, setVaccs] = useState<VaccRow[]>(initialVaccinations ?? []);
  const { grippe, rhino } = useMemo(() => group(vaccs), [vaccs]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState<string>(''); // YYYY-MM-DD
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startEdit = (v: VaccRow) => {
    setError(null);
    setEditingId(v.id);
    setEditDate(v.date); // déjà YYYY-MM-DD
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDate('');
    setError(null);
  };

  const saveEdit = async (id: string) => {
    setError(null);
    if (!editDate) return setError('La date est obligatoire.');

    setBusyId(id);
    try {
      const res = await fetch('/api/vaccinations/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, date: editDate }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Erreur mise à jour.');

      setVaccs(prev => prev.map(v => (v.id === id ? { ...v, date: editDate } : v)));
      cancelEdit();

      // recalcul server de la fiche (statuts/échéances)
      router.refresh();
    } catch (e: any) {
      setError(e?.message || 'Erreur.');
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id: string) => {
    setError(null);

    if (!confirm('Supprimer ce vaccin ?')) return;

    setBusyId(id);
    try {
      const res = await fetch('/api/vaccinations/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Erreur suppression.');

      setVaccs(prev => prev.filter(v => v.id !== id));
      cancelEdit();

      router.refresh();
    } catch (e: any) {
      setError(e?.message || 'Erreur.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="mt-6 rounded-2xl bg-white border border-[#b3bec5]/60 shadow-sm">
      <div className="p-5 sm:p-6 border-b border-[#b3bec5]/40">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Historique vaccinal</h2>
            <p className="mt-1 text-slate-600 text-sm">
              Clique sur un vaccin pour modifier la date ou supprimer.
            </p>
          </div>

          <Link
            href={`/horses/${horseId}/vaccinations/new`}
            className="rounded-xl bg-[#1d5998] px-4 py-2 font-semibold text-white hover:opacity-95"
          >
            + Ajouter
          </Link>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {error}
          </div>
        )}
      </div>

      <div className="p-5 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <VaccBlock
            title="Grippe"
            rows={grippe}
            editingId={editingId}
            editDate={editDate}
            setEditDate={setEditDate}
            busyId={busyId}
            onEdit={startEdit}
            onCancel={cancelEdit}
            onSave={saveEdit}
            onDelete={remove}
          />

          <VaccBlock
            title="Rhino"
            rows={rhino}
            editingId={editingId}
            editDate={editDate}
            setEditDate={setEditDate}
            busyId={busyId}
            onEdit={startEdit}
            onCancel={cancelEdit}
            onSave={saveEdit}
            onDelete={remove}
          />
        </div>
      </div>
    </section>
  );
}

function VaccBlock({
  title,
  rows,
  editingId,
  editDate,
  setEditDate,
  busyId,
  onEdit,
  onCancel,
  onSave,
  onDelete,
}: {
  title: string;
  rows: VaccRow[];
  editingId: string | null;
  editDate: string;
  setEditDate: (v: string) => void;
  busyId: string | null;
  onEdit: (v: VaccRow) => void;
  onCancel: () => void;
  onSave: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-3">
        <div className="text-lg font-extrabold text-slate-900 tracking-wide" translate="no">
          {title}
        </div>
        <div className="text-sm text-slate-600">
          {rows.length} dose{rows.length > 1 ? 's' : ''}
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-[#b3bec5]/60 bg-[#e7ebed]/25 p-4 text-slate-700">
          Aucun vaccin renseigné.
        </div>
      ) : (
        <ul className="relative space-y-3 pl-4">
          <span className="absolute left-[9px] top-0 bottom-0 w-px bg-[#b3bec5]/60" />

          {rows.map((r, idx) => {
            const dose = doseLabel(rows.length - idx);
            const isEditing = editingId === r.id;
            const busy = busyId === r.id;

            return (
              <li
                key={r.id}
                className="relative rounded-2xl bg-white border border-[#b3bec5]/60 px-4 py-3 shadow-sm"
              >
                <span className="absolute -left-[3px] top-6 h-3 w-3 rounded-full bg-[#1d5998]" />

                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500">{dose}</span>

                    {!isEditing ? (
                      <span className="text-sm font-extrabold text-slate-900">
                        {safeFormatDate(r.date)}
                      </span>
                    ) : (
                      <div className="mt-1">
                        <input
                          type="date"
                          value={editDate}
                          onChange={e => setEditDate(e.target.value)}
                          disabled={busy}
                          className="w-full rounded-xl border border-[#b3bec5]/60 px-3 py-2 outline-none focus:ring-2 focus:ring-[#1d5998]/30 disabled:opacity-60"
                        />
                      </div>
                    )}

                    <span className="text-xs font-semibold text-slate-500 mt-1">
                      {idx === 0 ? 'Dernier vaccin' : ''}
                    </span>
                  </div>

                  {!isEditing ? (
                    <div className="flex flex-col gap-2 items-end">
                      <button
                        type="button"
                        onClick={() => onEdit(r)}
                        className="rounded-xl border border-[#b3bec5]/60 bg-white px-3 py-2 text-xs font-extrabold text-[#1d5998] hover:bg-[#e7ebed]"
                      >
                        Modifier
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(r.id)}
                        disabled={busy}
                        className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-extrabold text-red-700 hover:opacity-95 disabled:opacity-60"
                      >
                        Supprimer
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 items-end">
                      <button
                        type="button"
                        onClick={() => onSave(r.id)}
                        disabled={busy}
                        className="rounded-xl bg-[#1d5998] px-3 py-2 text-xs font-extrabold text-white hover:opacity-95 disabled:opacity-60"
                      >
                        {busy ? 'Sauvegarde…' : 'Enregistrer'}
                      </button>
                      <button
                        type="button"
                        onClick={onCancel}
                        disabled={busy}
                        className="rounded-xl border border-[#b3bec5]/60 bg-white px-3 py-2 text-xs font-extrabold text-slate-700 hover:bg-[#e7ebed] disabled:opacity-60"
                      >
                        Annuler
                      </button>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}