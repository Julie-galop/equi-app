import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { nextDueDate, getStatus } from '@/lib/calcDue';
import { parseISO, format, differenceInYears } from 'date-fns';
import VaccHistoryClient from './VaccHistoryClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type VaccType = 'GRIPPE' | 'RHINO';
type VaccRow = { id: string; type: VaccType; date: string };

// Selon ton lib, getStatus peut renvoyer plus de valeurs.
// On garde large pour éviter les erreurs.
type Status = 'a_faire' | 'en_retard' | 'bientot' | 'a_jour' | 'inconnu';

function kindSummaryFromCount(count: number) {
  if (count <= 0) return '—';
  if (count === 1) return 'Primo 1';
  if (count === 2) return 'Primo 2';
  if (count === 3) return 'Primo 3';
  return `Rappel ${count - 3}`;
}

function safeFormatDate(d?: string | null) {
  if (!d) return null;
  try {
    return format(parseISO(d), 'dd/MM/yyyy');
  } catch {
    return null;
  }
}

function computeAgeLabel(birthdate?: string | null, birthYear?: number | null) {
  const now = new Date();

  if (birthdate) {
    try {
      const bd = parseISO(birthdate);
      const age = differenceInYears(now, bd);
      return `${age} ans (né(e) le ${format(bd, 'dd/MM/yyyy')})`;
    } catch {
      // fallback année
    }
  }

  if (birthYear) {
    const age = now.getFullYear() - birthYear;
    return `${age} ans (né(e) en ${birthYear})`;
  }

  return 'Âge non renseigné';
}

function statusLabel(s: Status) {
  if (s === 'a_faire') return 'À faire';
  if (s === 'en_retard') return 'En retard';
  if (s === 'bientot') return 'Bientôt';
  if (s === 'a_jour') return 'À jour';
  return 'Inconnu';
}

function statusPillClass(s: Status) {
  if (s === 'a_faire') return 'border-sky-200 bg-sky-50 text-sky-700';
  if (s === 'en_retard') return 'border-red-200 bg-red-50 text-red-700';
  if (s === 'bientot') return 'border-orange-200 bg-orange-50 text-orange-700';
  if (s === 'a_jour') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  return 'border-[#b3bec5]/60 bg-white text-slate-600';
}

function statusDotClass(s: Status) {
  if (s === 'a_faire') return 'bg-sky-500';
  if (s === 'en_retard') return 'bg-red-500';
  if (s === 'bientot') return 'bg-orange-400';
  if (s === 'a_jour') return 'bg-emerald-500';
  return 'bg-slate-300';
}

function overallStatus(a: Status, b: Status): Status {
  // priorité : retard > bientôt > à faire > à jour > inconnu
  const w = (s: Status) =>
    s === 'en_retard' ? 0 :
    s === 'bientot'  ? 1 :
    s === 'a_faire'  ? 2 :
    s === 'a_jour'   ? 3 :
    4;

  return w(a) <= w(b) ? a : b;
}

function parseDatesSafe(rows: { date: string }[]): Date[] {
  return rows
    .map(v => {
      try {
        return parseISO(v.date);
      } catch {
        return null;
      }
    })
    .filter(Boolean) as Date[];
}

export default async function HorsePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: horseId } = await params;

  // ✅ IMPORTANT : on utilise le server client (cookies session -> RLS OK)
  const supabase = await createSupabaseServerClient();

  // Sécurité : évite l'appel Supabase si l'ID n'existe pas
  if (!horseId || horseId === 'undefined') {
    return (
      <main className="min-h-screen bg-[#e7ebed] text-slate-900" translate="no">
        <div className="px-4 sm:px-6 lg:px-10 py-8 max-w-3xl">
          <h1 className="text-2xl font-extrabold text-[#1d5998]">Fiche cheval</h1>

          <div className="mt-4 rounded-2xl bg-white border border-red-200 p-5 text-red-700">
            ID cheval manquant ou invalide dans l’URL.
            <div className="text-sm mt-2 text-red-600">
              Valeur reçue : <span className="font-mono">{String(horseId)}</span>
            </div>
          </div>

          <div className="mt-5">
            <Link
              href="/horses"
              className="inline-flex items-center rounded-xl border border-[#b3bec5]/60 bg-white px-4 py-2 font-semibold text-[#1d5998] hover:bg-[#e7ebed]"
            >
              ← Retour à la liste
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // ✅ Cheval
  const { data: horse, error: horseErr } = await supabase
    .from('horses')
    .select('id, name, affixe, sire, dam, dam_sire, birthdate, birth_year')
    .eq('id', horseId)
    .single();

  if (horseErr || !horse) {
    return (
      <main className="min-h-screen bg-[#e7ebed] text-slate-900" translate="no">
        <div className="px-4 sm:px-6 lg:px-10 py-8 max-w-3xl">
          <h1 className="text-2xl font-extrabold text-[#1d5998]">Fiche cheval</h1>

          <div className="mt-4 rounded-2xl bg-white border border-red-200 p-5 text-red-700">
            Impossible de charger le cheval.
            <div className="text-sm mt-2 text-red-600">
              {horseErr?.message ?? 'Erreur inconnue'}
            </div>
          </div>

          <div className="mt-5">
            <Link
              href="/horses"
              className="inline-flex items-center rounded-xl border border-[#b3bec5]/60 bg-white px-4 py-2 font-semibold text-[#1d5998] hover:bg-[#e7ebed]"
            >
              ← Retour à la liste
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // ✅ Nom affiché = "Nom + Affixe"
  const displayName = [horse.name, horse.affixe].filter(Boolean).join(' ').trim();
  const ageLabel = computeAgeLabel(horse.birthdate ?? null, horse.birth_year ?? null);

  // ✅ Vaccinations
  const { data: vaccs, error: vaccErr } = await supabase
    .from('vaccinations')
    .select('id, type, date')
    .eq('horse_id', horseId);

  if (vaccErr) {
    // On continue quand même avec un historique vide (page non cassée)
    // et on laisse le client afficher le reste.
  }

  const vaccinations = (vaccs ?? []) as VaccRow[];

  const grippe = vaccinations
    .filter(v => v.type === 'GRIPPE')
    .sort((a, b) => (a.date > b.date ? -1 : 1));

  const rhino = vaccinations
    .filter(v => v.type === 'RHINO')
    .sort((a, b) => (a.date > b.date ? -1 : 1));

  const lastGrippe = grippe[0]?.date ?? null;
  const lastRhino = rhino[0]?.date ?? null;

  const grippeDates = parseDatesSafe(grippe);
  const rhinoDates = parseDatesSafe(rhino);

  const nextGrippe = nextDueDate(grippeDates);
  const nextRhino = nextDueDate(rhinoDates);

  const sG: Status = (getStatus(nextGrippe) as Status) ?? 'inconnu';
  const sR: Status = (getStatus(nextRhino) as Status) ?? 'inconnu';
  const overall = overallStatus(sG, sR);

  const nextGrippeLabel = nextGrippe ? format(nextGrippe, 'dd/MM/yyyy') : '—';
  const nextRhinoLabel = nextRhino ? format(nextRhino, 'dd/MM/yyyy') : '—';

  const kindG = kindSummaryFromCount(grippe.length);
  const kindR = kindSummaryFromCount(rhino.length);

  const needsAction =
    sG === 'en_retard' || sG === 'bientot' || sG === 'a_faire' ||
    sR === 'en_retard' || sR === 'bientot' || sR === 'a_faire';

  const isLate = sG === 'en_retard' || sR === 'en_retard';

  return (
    <main className="min-h-screen bg-[#e7ebed] text-slate-900" translate="no">
      <div className="px-4 sm:px-6 lg:px-10 py-6 sm:py-10 pb-[calc(10rem+env(safe-area-inset-bottom))] md:pb-10 max-w-5xl">
        {/* Top */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <Link
                href="/horses"
                className="inline-flex items-center rounded-xl border border-[#b3bec5]/60 bg-white px-3 py-2 font-semibold text-[#1d5998] hover:bg-[#e7ebed]"
              >
                ← Retour
              </Link>

              <span className="text-xs font-semibold text-slate-500">
                ID : <span className="font-mono">{horseId}</span>
              </span>

              {/* Statut global */}
              <span
                className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-extrabold ${statusPillClass(
                  overall
                )}`}
              >
                <span className={`h-2 w-2 rounded-full ${statusDotClass(overall)}`} />
                {statusLabel(overall)}
              </span>
            </div>

            <h1 className="mt-4 text-2xl sm:text-3xl font-extrabold text-[#1d5998] truncate">
              {displayName || 'Cheval'}
            </h1>
            <p className="mt-1 text-slate-600">{ageLabel}</p>
          </div>

          <div className="flex gap-2 sm:justify-end">
            <Link
              href={`/horses/${horseId}/vaccinations/new`}
              className="rounded-xl bg-[#1d5998] px-4 py-2 font-semibold text-white hover:opacity-95 text-center"
            >
              + Ajouter un vaccin
            </Link>
            <Link
              href={`/horses/${horseId}/edit`}
              className="rounded-xl border border-[#b3bec5]/60 bg-white px-4 py-2 font-semibold text-[#1d5998] hover:bg-[#e7ebed]"
            >
              Modifier
            </Link>
          </div>
        </div>

        {/* ✅ Cartes “statut vaccinal” */}
        <section className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <VaccineFocusCard
            title="Grippe"
            status={sG}
            last={safeFormatDate(lastGrippe) ?? '—'}
            next={nextGrippeLabel}
            kind={kindG}
            doses={grippe.length}
          />
          <VaccineFocusCard
            title="Rhino"
            status={sR}
            last={safeFormatDate(lastRhino) ?? '—'}
            next={nextRhinoLabel}
            kind={kindR}
            doses={rhino.length}
          />
        </section>

        {needsAction && (
          <div
            className={`mt-6 rounded-2xl border p-5 ${
              isLate
                ? 'border-red-200 bg-red-50 text-red-800'
                : 'border-orange-200 bg-orange-50 text-orange-800'
            }`}
          >
            <div className="font-extrabold">
              {isLate ? '🚨 Vaccin en retard' : '🔔 Vaccin à faire bientôt'}
            </div>

            <div className="mt-1 text-sm">
              {isLate
                ? "Un rappel est dépassé : ajoute-le dès qu’il est fait."
                : "Une échéance arrive : pense à programmer le rappel."}
            </div>
          </div>
        )}

        {/* Identité / Origines */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <section className="rounded-2xl bg-white border border-[#b3bec5]/60 shadow-sm p-5 sm:p-6">
            <h2 className="text-xl font-extrabold text-slate-900">Identité</h2>

            <div className="mt-4 space-y-3 text-sm">
              <Row label="Nom" value={horse.name ?? '—'} />
              <Row label="Affixe" value={horse.affixe ?? '—'} />
              <Row
                label="Naissance"
                value={
                  safeFormatDate(horse.birthdate ?? null) ??
                  (horse.birth_year ? `${horse.birth_year}` : '—')
                }
              />
            </div>
          </section>

          <section className="rounded-2xl bg-white border border-[#b3bec5]/60 shadow-sm p-5 sm:p-6">
            <h2 className="text-xl font-extrabold text-slate-900">Origines</h2>

            <div className="mt-4 space-y-3 text-sm">
              <Row label="Père" value={horse.sire ?? '—'} />
              <Row label="Mère" value={horse.dam ?? '—'} />
              <Row label="Père de la mère" value={horse.dam_sire ?? '—'} />
            </div>
          </section>
        </div>

        {/* Historique */}
        <VaccHistoryClient horseId={horseId} initialVaccinations={vaccinations} />

        {/* double sécurité anti-recouvrement bottom nav */}
        <div className="md:hidden h-20" />
      </div>

      {/* Bottom nav mobile */}
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="text-slate-500 font-semibold">{label}</div>
      <div className="text-slate-900 font-extrabold text-right max-w-[70%] break-words">
        {value}
      </div>
    </div>
  );
}

function VaccineFocusCard({
  title,
  status,
  last,
  next,
  kind,
  doses,
}: {
  title: 'Grippe' | 'Rhino';
  status: Status;
  last: string;
  next: string;
  kind: string;
  doses: number;
}) {
  const pill = statusPillClass(status);
  const dot = statusDotClass(status);

  return (
    <div className="rounded-2xl bg-white border border-[#b3bec5]/60 shadow-sm overflow-hidden">
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-extrabold tracking-wider text-slate-700" translate="no">
              {title.toUpperCase()}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-extrabold ${pill}`}
              >
                <span className={`h-2 w-2 rounded-full ${dot}`} />
                {statusLabel(status)}
              </span>

              <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold border bg-[#e7ebed] text-[#1d5998] border-[#b3bec5]/70">
                {kind}
              </span>

              <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold border bg-white text-slate-600 border-[#b3bec5]/60">
                {doses} dose{doses > 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <div className="h-10 w-10 rounded-2xl bg-[#e7ebed] border border-[#b3bec5]/60 flex items-center justify-center">
            <span className="font-extrabold text-[#1d5998]" translate="no">
              {title === 'Grippe' ? 'G' : 'R'}
            </span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-[#e7ebed]/35 border border-[#b3bec5]/40 p-3">
            <div className="text-xs text-slate-500">Dernier</div>
            <div className="font-extrabold text-slate-900">{last}</div>
          </div>
          <div className="rounded-xl bg-[#e7ebed]/35 border border-[#b3bec5]/40 p-3">
            <div className="text-xs text-slate-500">Échéance</div>
            <div className="font-extrabold text-slate-900">{next}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

