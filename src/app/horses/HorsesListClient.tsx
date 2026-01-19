'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import type { HorseCard } from './page';

type Status = 'a_faire' | 'en_retard' | 'bientot' | 'a_jour' | 'inconnu';
type SectionTone = 'urgent' | 'soon' | 'ok' | 'info';

function normalize(str: string) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function getStatusFromVaccine(v: any): Status {
  const s = v?.status as Status | undefined;
  if (s === 'a_faire' || s === 'en_retard' || s === 'bientot' || s === 'a_jour') return s;

  // compat anciens champs éventuels
  if (v?.isLate === true) return 'en_retard';
  if (v?.isSoon === true) return 'bientot';
  if (v?.isUpToDate === true) return 'a_jour';

  // si aucune donnée : on préfère "inconnu" ici (le server peut envoyer "a_faire")
  return 'inconnu';
}

function formatMaybeDate(d: any) {
  if (!d) return '—';
  try {
    const date = typeof d === 'string' ? new Date(d) : d;
    return format(date, 'dd/MM/yyyy');
  } catch {
    return '—';
  }
}

function toneStyles(tone: SectionTone) {
  if (tone === 'urgent') {
    return {
      wrap: 'border-red-200 bg-red-50/40',
      bar: 'bg-red-500',
      count: 'bg-red-600',
      cardRing: 'ring-1 ring-red-200/70',
    };
  }
  if (tone === 'soon') {
    return {
      wrap: 'border-orange-200 bg-orange-50/35',
      bar: 'bg-orange-400',
      count: 'bg-orange-500',
      cardRing: 'ring-1 ring-orange-200/70',
    };
  }
    if (tone === 'info') {
    return {
      wrap: 'border-sky-200 bg-sky-50/40',
      bar: 'bg-sky-500',
      count: 'bg-sky-600',
      cardRing: 'ring-1 ring-sky-200/70',
    };
  }
  return {
    wrap: 'border-emerald-200 bg-emerald-50/30',
    bar: 'bg-emerald-500',
    count: 'bg-emerald-600',
    cardRing: 'ring-1 ring-emerald-200/70',
  };
}

function KindBadge({ kind }: { kind?: string }) {
  const label = kind || '—';
  const cls =
    label.startsWith('Primo')
      ? 'bg-white text-[#1d5998] border-[#b3bec5]/70'
      : label.startsWith('Rappel')
        ? 'bg-[#e7ebed] text-[#1d5998] border-[#b3bec5]/70'
        : label === 'Primo'
          ? 'bg-white text-[#1d5998] border-[#b3bec5]/70'
          : label === 'Rappel'
            ? 'bg-[#e7ebed] text-[#1d5998] border-[#b3bec5]/70'
            : 'bg-white text-slate-500 border-[#b3bec5]/60';

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold border ${cls}`}>
      {label}
    </span>
  );
}

function StatusPill({ status }: { status: Status }) {
  if (status === 'a_faire') {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">
        <span className="h-2 w-2 rounded-full bg-sky-500" />
        À faire
      </span>
    );
  }
  if (status === 'en_retard') {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
        <span className="h-2 w-2 rounded-full bg-red-500" />
        En retard
      </span>
    );
  }
  if (status === 'bientot') {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700">
        <span className="h-2 w-2 rounded-full bg-orange-400" />
        Bientôt
      </span>
    );
  }
  if (status === 'a_jour') {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        À jour
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-[#b3bec5]/60 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
      <span className="h-2 w-2 rounded-full bg-slate-300" />
      Inconnu
    </span>
  );
}

function VaccineMini({
  label,
  v,
  horseId,
  type,
  onQuickDone,
  quickLoading,
}: {
  label: string;
  v: any;
  horseId: string;
  type: 'GRIPPE' | 'RHINO';
  onQuickDone: (horseId: string, type: 'GRIPPE' | 'RHINO') => void;
  quickLoading: boolean;
}) {
  const last = v?.lastDate ?? null;
  const next = v?.nextDue ?? null;
  const kind = v?.kind ?? undefined;
  const status = getStatusFromVaccine(v);

  const showQuick =
    status === 'a_faire' || status === 'bientot' || status === 'en_retard';

  return (
    <div className="rounded-2xl border border-[#b3bec5]/60 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-extrabold tracking-wider text-slate-700" translate="no">
            {label.toUpperCase()}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <StatusPill status={status} />
            <KindBadge kind={kind} />
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-[#e7ebed]/35 border border-[#b3bec5]/40 p-3">
          <div className="text-xs text-slate-500">Dernier</div>
          <div className="font-extrabold text-slate-900">{formatMaybeDate(last)}</div>
        </div>
        <div className="rounded-xl bg-[#e7ebed]/35 border border-[#b3bec5]/40 p-3">
          <div className="text-xs text-slate-500">Échéance</div>
          <div className="font-extrabold text-slate-900">{formatMaybeDate(next)}</div>
        </div>
      </div>

      {showQuick && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => onQuickDone(horseId, type)}
            disabled={quickLoading}
            className="w-full rounded-xl bg-[#1d5998] px-3 py-2 text-sm font-extrabold text-white hover:opacity-95 disabled:opacity-60"
            title="Ajoute automatiquement un vaccin à la date du jour"
          >
            {quickLoading ? 'Enregistrement…' : '✅ Rappel fait (aujourd’hui)'}
          </button>
          <div className="mt-1 text-xs text-slate-500">
            Ajoute une ligne dans l’historique du cheval.
          </div>
        </div>
      )}
    </div>
  );
}

function SectionHeader({
  title,
  count,
  open,
  toggle,
  hint,
  tone,
}: {
  title: string;
  count: number;
  open: boolean;
  toggle: () => void;
  hint: string;
  tone: SectionTone;
}) {
  const t = toneStyles(tone);

  return (
    <button
      type="button"
      onClick={toggle}
      className={`w-full relative overflow-hidden rounded-2xl border shadow-sm px-5 py-4 text-left hover:opacity-95 ${t.wrap}`}
    >
      <span className={`absolute left-0 top-0 bottom-0 w-2 ${t.bar}`} />

      <div className="flex items-center justify-between gap-4">
        <div className="pl-2">
          <div className="text-lg sm:text-xl font-extrabold text-slate-900">{title}</div>
          <div className="text-sm text-slate-700/80">{hint}</div>
        </div>

        <div className="flex items-center gap-3">
          <div className={`rounded-xl text-white px-3 py-2 font-extrabold min-w-[3rem] text-center ${t.count}`}>
            {count}
          </div>
          <div className="text-slate-700 text-sm font-semibold">{open ? 'Masquer' : 'Afficher'}</div>
        </div>
      </div>
    </button>
  );
}

export default function HorsesListClient({ initialCards }: { initialCards: HorseCard[] }) {
  const router = useRouter();

  const [q, setQ] = useState('');
  const [quickKey, setQuickKey] = useState<string | null>(null); // `${horseId}-${type}`
  const [quickError, setQuickError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const query = normalize(q.trim());
    if (!query) return initialCards;
    return initialCards.filter(c => normalize(c.displayName).includes(query));
  }, [q, initialCards]);

  const grouped = useMemo(() => {
  const urgent: HorseCard[] = [];
  const soon: HorseCard[] = [];
  const ok: HorseCard[] = [];
  const rhinoTodo: HorseCard[] = [];

  for (const h of filtered) {
    const sG = getStatusFromVaccine((h as any).grippe);
    const sR = getStatusFromVaccine((h as any).rhino);

    // 1) Urgent = au moins un en retard
    const anyLate = sG === 'en_retard' || sR === 'en_retard';

    // 2) Bientôt = au moins un bientot (UNIQUEMENT)
    const anySoon = sG === 'bientot' || sR === 'bientot';

    // 3) Rhino à lancer = rhino pas commencé MAIS grippe à jour
    const rhinoEmpty = !(h as any)?.rhino?.lastDate; // pas de rhino enregistré
    const needsRhinoStart = rhinoEmpty && sG === 'a_jour';

    // 4) À jour = grippe à jour ET (rhino à jour OU rhino pas commencé)
    const isOk = sG === 'a_jour' && (sR === 'a_jour' || rhinoEmpty);

    if (anyLate) urgent.push(h);
    else if (anySoon) soon.push(h);
    else if (needsRhinoStart) rhinoTodo.push(h);
    else if (isOk) ok.push(h);
    else ok.push(h);
  }

  return { urgent, soon, ok, rhinoTodo };
}, [filtered]);

  const [openUrgent, setOpenUrgent] = useState(true);
  const [openSoon, setOpenSoon] = useState(true);
  const [openOk, setOpenOk] = useState(false);
  const [openRhinoTodo, setOpenRhinoTodo] = useState(false);

  const bottomNavReserve = 'pb-[calc(12rem+env(safe-area-inset-bottom))]';

  const quickDone = async (horseId: string, type: 'GRIPPE' | 'RHINO') => {
    setQuickError(null);

    const key = `${horseId}-${type}`;
    setQuickKey(key);

    try {
      const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

      const res = await fetch('/api/vaccinations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          horseId,
          type,
          date: today,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Erreur lors de la création.');

      // 🔄 recalcul server (statuts + échéances) + remonte dans la liste
      router.refresh();
    } catch (e: any) {
      setQuickError(e?.message || 'Erreur.');
    } finally {
      setQuickKey(null);
    }
  };

  return (
    <main className="min-h-screen bg-[#e7ebed] text-slate-900" translate="no">
      <div className={`px-4 sm:px-6 lg:px-10 py-6 sm:py-10 ${bottomNavReserve} md:pb-10`}>
        {/* Header */}
        <div className="flex items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1d5998]">Chevaux</h1>
            <p className="text-slate-600 mt-1">Groupés par priorité vaccinale (repliables)</p>
          </div>

          <Link
            href="/horses/new"
            className="rounded-xl bg-[#1d5998] px-4 py-2 font-semibold text-white hover:opacity-95"
          >
            + Ajouter
          </Link>
        </div>

        {quickError && (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            {quickError}
          </div>
        )}

        {/* Search */}
        <div className="mt-5 rounded-2xl bg-white border border-[#b3bec5]/60 shadow-sm p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="flex-1">
              <label className="text-sm font-semibold text-slate-700">Rechercher un cheval</label>
              <input
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Tape une lettre ou un nom…"
                className="mt-1 w-full rounded-xl border border-[#b3bec5]/60 px-3 py-2 outline-none focus:ring-2 focus:ring-[#1d5998]/30"
              />
              <div className="mt-2 text-xs text-slate-500">
                Astuce : ignore la casse et les accents (é = e).
              </div>
            </div>

            <div className="sm:text-right text-sm text-slate-600">
              Résultats : <span className="font-extrabold text-slate-900">{filtered.length}</span>
            </div>
          </div>
        </div>

        {/* Résumé dashboard */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
          <SummaryCard label="En retard" value={grouped.urgent.length} tone="urgent" />
          <SummaryCard label="Bientôt" value={grouped.soon.length} tone="soon" />
          <SummaryCard label="À jour" value={grouped.ok.length} tone="ok" />
          <SummaryCard label="Rhino à lancer" value={grouped.rhinoTodo.length} tone="info" />
          <SummaryCard label="Total" value={filtered.length} tone="neutral" />
        </div>


        {/* Sections */}
        <div className="mt-6 space-y-4">
          <SectionHeader
            title="Urgent"
            count={grouped.urgent.length}
            open={openUrgent}
            toggle={() => setOpenUrgent(v => !v)}
            hint="Au moins un vaccin en retard."
            tone="urgent"
          />
          {openUrgent && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {grouped.urgent.length ? (
                grouped.urgent.map(h => (
                  <HorseCardUI key={h.id} h={h} tone="urgent" onQuickDone={quickDone} quickKey={quickKey} />
                ))
              ) : (
                <EmptyBox text="Aucun cheval en retard 🎉" />
              )}
            </div>
          )}

          <SectionHeader
            title="Bientôt"
            count={grouped.soon.length}
            open={openSoon}
            toggle={() => setOpenSoon(v => !v)}
            hint="Échéance proche (dans les prochains jours)."
            tone="soon"
          />
          {openSoon && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {grouped.soon.length ? (
                grouped.soon.map(h => (
                  <HorseCardUI key={h.id} h={h} tone="soon" onQuickDone={quickDone} quickKey={quickKey} />
                ))
              ) : (
                <EmptyBox text="Aucun cheval à vacciner bientôt." />
              )}
            </div>
          )}

          <SectionHeader
            title="À jour"
            count={grouped.ok.length}
            open={openOk}
            toggle={() => setOpenOk(v => !v)}
            hint="Tout est OK (ou pas encore renseigné)."
            tone="ok"
          />
          {openOk && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {grouped.ok.length ? (
                grouped.ok.map(h => (
                  <HorseCardUI key={h.id} h={h} tone="ok" onQuickDone={quickDone} quickKey={quickKey} />
                ))
              ) : (
                <EmptyBox text="Aucun cheval dans cette catégorie." />
              )}
            </div>
          )}

          <SectionHeader
            title="Rhino à lancer"
            count={grouped.rhinoTodo.length}
            open={openRhinoTodo}
            toggle={() => setOpenRhinoTodo(v => !v)}
            hint="Grippe à jour, mais parcours Rhino pas commencé."
            tone="info"
          />

          {openRhinoTodo && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {grouped.rhinoTodo.length ? (
                grouped.rhinoTodo.map(h => (
                  <HorseCardUI
                    key={h.id}
                    h={h}
                    tone="ok"
                    onQuickDone={quickDone}
                    quickKey={quickKey}
                  />
                ))
              ) : (
                <EmptyBox text="Aucun cheval à lancer en Rhino." />
              )}
            </div>
          )}
        </div>

        <div className="h-6 md:hidden" />
      </div>

      {/* Bottom nav */}
      <nav className="md:hidden fixed left-0 right-0 z-50 bottom-[max(1rem,env(safe-area-inset-bottom))] pointer-events-none">
        <div className="mx-auto w-[calc(100%-2rem)] max-w-md rounded-2xl bg-white border border-[#b3bec5]/60 shadow-xl pointer-events-auto">
          <div className="grid grid-cols-3 gap-2 p-2">
            <Link
              href="/"
              className="text-center rounded-xl px-3 py-3 font-semibold text-[#1d5998] hover:bg-[#e7ebed]"
            >
              Accueil
            </Link>

            <Link
              href="/horses"
              className="text-center rounded-xl px-3 py-3 font-semibold bg-[#1d5998] text-white"
            >
              Chevaux
            </Link>

            <Link
              href="/horses/new"
              className="text-center rounded-xl px-3 py-3 font-semibold text-[#1d5998] hover:bg-[#e7ebed]"
            >
              + Ajouter
            </Link>
          </div>
        </div>
      </nav>
    </main>
  );
}

function EmptyBox({ text }: { text: string }) {
  return (
    <div className="rounded-2xl bg-white border border-[#b3bec5]/60 shadow-sm p-6 text-slate-700">
      <div className="font-extrabold text-slate-900">{text}</div>
    </div>
  );
}

function HorseCardUI({
  h,
  tone,
  onQuickDone,
  quickKey,
}: {
  h: HorseCard;
  tone: SectionTone;
  onQuickDone: (horseId: string, type: 'GRIPPE' | 'RHINO') => void;
  quickKey: string | null;
}) {
  const grippe = (h as any).grippe;
  const rhino = (h as any).rhino;
  const t = toneStyles(tone);

  const loadingG = quickKey === `${h.id}-GRIPPE`;
  const loadingR = quickKey === `${h.id}-RHINO`;

  return (
    <div className={`rounded-2xl bg-white border border-[#b3bec5]/60 shadow-sm overflow-hidden ${t.cardRing}`}>
      <div className="px-5 pt-5 sm:px-6 sm:pt-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              href={`/horses/${h.id}`}
              className="block font-extrabold text-lg text-slate-900 hover:underline truncate"
              title={h.displayName}
            >
              {h.displayName}
            </Link>
            <div className="mt-1 text-sm text-slate-600">{h.ageLabel}</div>
          </div>

          <Link
            href={`/horses/${h.id}/vaccinations/new`}
            className="shrink-0 rounded-xl bg-[#1d5998] px-3 py-2 text-sm font-extrabold text-white hover:opacity-95"
            title="Ajouter un vaccin"
          >
            + vaccin
          </Link>
        </div>
      </div>

      <div className="px-5 pb-5 sm:px-6 sm:pb-6 mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <VaccineMini
          label="Grippe"
          v={grippe}
          horseId={h.id}
          type="GRIPPE"
          onQuickDone={onQuickDone}
          quickLoading={loadingG}
        />
        <VaccineMini
          label="Rhino"
          v={rhino}
          horseId={h.id}
          type="RHINO"
          onQuickDone={onQuickDone}
          quickLoading={loadingR}
        />
      </div>

      <div className="border-t border-[#b3bec5]/40 bg-[#e7ebed]/25 px-5 py-4 sm:px-6 flex flex-wrap gap-2">
        <Link
          href={`/horses/${h.id}`}
          className="rounded-xl border border-[#b3bec5]/60 bg-white px-3 py-2 text-sm font-semibold text-[#1d5998] hover:bg-[#e7ebed]"
        >
          Voir la fiche
        </Link>
        <Link
          href={`/horses/${h.id}/vaccinations/new`}
          className="rounded-xl border border-[#b3bec5]/60 bg-[#e7ebed] px-3 py-2 text-sm font-semibold text-[#1d5998] hover:opacity-90"
        >
          Ajouter un vaccin
        </Link>
      </div>
    </div>
  );
}
function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'urgent' | 'soon' | 'ok' | 'neutral' | 'info';
}) {
  const styles =
    tone === 'urgent'
      ? { wrap: 'border-red-200 bg-red-50/40', dot: 'bg-red-500', text: 'text-red-700' }
      : tone === 'soon'
        ? { wrap: 'border-orange-200 bg-orange-50/35', dot: 'bg-orange-400', text: 'text-orange-700' }
        : tone === 'ok'
          ? { wrap: 'border-emerald-200 bg-emerald-50/30', dot: 'bg-emerald-500', text: 'text-emerald-700' }
          : tone === 'info'
            ? { wrap: 'border-sky-200 bg-sky-50/40', dot: 'bg-sky-500', text: 'text-sky-700' }
            : { wrap: 'border-[#b3bec5]/60 bg-white', dot: 'bg-slate-300', text: 'text-slate-700' };

  return (
    <div className={`rounded-2xl border ${styles.wrap} shadow-sm p-4`}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-semibold text-slate-600">{label}</div>
          <div className="mt-1 text-2xl font-extrabold text-slate-900">{value}</div>
        </div>
        <span className={`h-3 w-3 rounded-full ${styles.dot}`} />
      </div>

      <div className={`mt-2 text-xs font-semibold ${styles.text}`}>
        {tone === 'urgent' ? 'Priorité' : tone === 'soon' ? 'À prévoir' : tone === 'ok' ? 'OK' : tone === 'info' ? 'À prévoir' : 'Vue globale'}
      </div>
    </div>
  );
}