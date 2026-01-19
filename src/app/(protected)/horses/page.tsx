import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { parseISO, differenceInYears } from 'date-fns';
import { nextDueDate, getStatus } from '@/lib/calcDue';
import HorsesListClient from './HorsesListClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type HorseRow = {
  id: string;
  name: string | null;
  affixe: string | null;
  birthdate: string | null;
  birth_year: number | null;
};

type VaccRow = {
  horse_id: string;
  type: 'GRIPPE' | 'RHINO';
  date: string; // YYYY-MM-DD
};

type Status = 'a_faire' | 'en_retard' | 'bientot' | 'a_jour';

type VaccineStatus = {
  type: 'GRIPPE' | 'RHINO';
  label: 'Grippe' | 'Rhino';
  lastDate: string | null; // "YYYY-MM-DD"
  nextDue: string | null;  // "YYYY-MM-DD"
  status: Status;          // ✅ ce que ton client attend
  kind: string;            // ex: "Primo 1", "Primo 2", "Rappel 1", "—"
};

export type HorseCard = {
  id: string;
  displayName: string;
  ageLabel: string;
  grippe: VaccineStatus;
  rhino: VaccineStatus;
};

function computeDisplayName(h: HorseRow) {
  const n = (h.name ?? '').trim();
  const a = (h.affixe ?? '').trim();
  const joined = [n, a].filter(Boolean).join(' ');
  return joined || 'Sans nom';
}

function computeAgeLabel(birthdate: string | null, birthYear: number | null) {
  const now = new Date();

  if (birthdate) {
    try {
      const d = parseISO(birthdate);
      const years = differenceInYears(now, d);
      if (!Number.isNaN(years) && years >= 0) return `${years} an${years > 1 ? 's' : ''}`;
    } catch {
      // ignore
    }
  }

  if (birthYear && birthYear >= 1900 && birthYear <= now.getFullYear()) {
    const years = now.getFullYear() - birthYear;
    return `${years} an${years > 1 ? 's' : ''} (né en ${birthYear})`;
  }

  return 'Âge inconnu';
}

function kindLabelFromCount(count: number) {
  if (count <= 0) return '—';
  if (count === 1) return 'Primo 1';
  if (count === 2) return 'Primo 2';
  if (count === 3) return 'Primo 3';
  return `Rappel ${count - 3}`;
}

function computeVaccineStatus(type: 'GRIPPE' | 'RHINO', vaccs: VaccRow[]): VaccineStatus {
  const label = type === 'GRIPPE' ? 'Grippe' : 'Rhino';

  const ofType = vaccs
    .filter(v => v.type === type)
    .map(v => ({ ...v, d: parseISO(v.date) }))
    .filter(v => !Number.isNaN(v.d.getTime()))
    .sort((a, b) => b.d.getTime() - a.d.getTime()); // plus récent -> plus ancien

  const count = ofType.length;

  if (count === 0) {
    return {
      type,
      label,
      lastDate: null,
      nextDue: null,
      status: 'a_faire',
      kind: '—',
    };
  }

  const lastDate = ofType[0].date;

  const dates: Date[] = ofType.map(x => x.d);
  const next = nextDueDate(dates); // Date | null
  const nextDue = next ? next.toISOString().slice(0, 10) : null;

  const status = getStatus(next);

  return {
    type,
    label,
    lastDate,
    nextDue,
    status,
    kind: kindLabelFromCount(count),
  };
}

export default async function HorsesPage() {
  const supabase = await createSupabaseServerClient();

  const { data: horses, error: horsesErr } = await supabase
    .from('horses')
    .select('id, name, affixe, birthdate, birth_year')
    .order('name', { ascending: true });

  if (horsesErr) {
    return (
      <main className="min-h-screen bg-[#e7ebed] p-6">
        <div className="rounded-2xl bg-white border border-[#b3bec5]/60 p-6">
          <h1 className="text-2xl font-extrabold text-[#1d5998]">Chevaux</h1>
          <p className="mt-3 text-slate-700">Erreur Supabase : {horsesErr.message}</p>
        </div>
      </main>
    );
  }

  const horseList = (horses ?? []) as HorseRow[];
  const horseIds = horseList.map(h => h.id);

  if (horseIds.length === 0) {
    return <HorsesListClient initialCards={[]} />;
  }

  const { data: vaccs, error: vaccErr } = await supabase
    .from('vaccinations')
    .select('horse_id, type, date')
    .in('horse_id', horseIds);

  if (vaccErr) {
    // On renvoie quand même les chevaux, mais sans statuts si vaccs KO
    const fallbackCards: HorseCard[] = horseList.map(h => ({
      id: h.id,
      displayName: computeDisplayName(h),
      ageLabel: computeAgeLabel(h.birthdate, h.birth_year),
      grippe: { type: 'GRIPPE', label: 'Grippe', lastDate: null, nextDue: null, status: 'a_faire', kind: '—' },
      rhino: { type: 'RHINO', label: 'Rhino', lastDate: null, nextDue: null, status: 'a_faire', kind: '—' },
    }));

    return <HorsesListClient initialCards={fallbackCards} />;
  }

  const vaccRows = (vaccs ?? []) as VaccRow[];

  const vaccByHorse = new Map<string, VaccRow[]>();
  for (const v of vaccRows) {
    const arr = vaccByHorse.get(v.horse_id) ?? [];
    arr.push(v);
    vaccByHorse.set(v.horse_id, arr);
  }

  const cards: HorseCard[] = horseList.map(h => {
    const hv = vaccByHorse.get(h.id) ?? [];
    return {
      id: h.id,
      displayName: computeDisplayName(h),
      ageLabel: computeAgeLabel(h.birthdate, h.birth_year),
      grippe: computeVaccineStatus('GRIPPE', hv),
      rhino: computeVaccineStatus('RHINO', hv),
    };
  });

  return <HorsesListClient initialCards={cards} />;
}