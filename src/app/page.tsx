import Link from 'next/link';
import BottomNav from '@/components/BottomNav';
import { supabase } from '@/lib/supabaseClient';
import { nextDueDate, getStatus } from '@/lib/calcDue';
import { parseISO, differenceInMonths, format } from 'date-fns';

type UpcomingItem = {
  id: string;
  horseId: string;
  horseName: string;
  vaccine: string;
  dueDate: Date;
  status: 'en_retard' | 'bientot';
};

export default async function Home() {
  const { data: horses } = await supabase.from('horses').select('id, name');
  const totalHorses = horses?.length ?? 0;

  let upcomingCount = 0;
  let upToDateCount = 0;
  const upcomingList: UpcomingItem[] = [];
  const now = new Date();

  for (const horse of horses ?? []) {
    const { data: vaccs } = await supabase
      .from('vaccinations')
      .select('type, date')
      .eq('horse_id', horse.id);

    const grippeDates = vaccs?.filter(v => v.type === 'GRIPPE').map(v => parseISO(v.date)) ?? [];
    const rhinoDates = vaccs?.filter(v => v.type === 'RHINO').map(v => parseISO(v.date)) ?? [];

    const grippeDue = nextDueDate(grippeDates);
    const rhinoDue = nextDueDate(rhinoDates);

    const grippeStatus = getStatus(grippeDue);
    const rhinoStatus = getStatus(rhinoDue);

    if ((grippeStatus === 'en_retard' || grippeStatus === 'bientot') && grippeDue) {
      upcomingCount++;
      upcomingList.push({
        id: `${horse.id}-grippe`,
        horseId: horse.id,
        horseName: horse.name,
        vaccine: 'Grippe',
        dueDate: grippeDue,
        status: grippeStatus,
      });
    }

    if ((rhinoStatus === 'en_retard' || rhinoStatus === 'bientot') && rhinoDue) {
      upcomingCount++;
      upcomingList.push({
        id: `${horse.id}-rhino`,
        horseId: horse.id,
        horseName: horse.name,
        vaccine: 'Rhino',
        dueDate: rhinoDue,
        status: rhinoStatus,
      });
    }

    const lastGrippe = grippeDates[grippeDates.length - 1];
    const lastRhino = rhinoDates[rhinoDates.length - 1];

    const upToDate =
      lastGrippe &&
      lastRhino &&
      differenceInMonths(now, lastGrippe) < 12 &&
      differenceInMonths(now, lastRhino) < 12;

    if (upToDate) upToDateCount++;
  }

  // ✅ Tri : en_retard d'abord, puis bientot, puis date
  const statusWeight = (s: 'en_retard' | 'bientot') => (s === 'en_retard' ? 0 : 1);
  upcomingList.sort((a, b) => {
    const sw = statusWeight(a.status) - statusWeight(b.status);
    if (sw !== 0) return sw;
    return a.dueDate.getTime() - b.dueDate.getTime();
  });

  const upToDatePercentage = totalHorses > 0 ? (upToDateCount / totalHorses) * 100 : 0;

  // petits helpers UI
  const VaccineBadge = ({ vaccine }: { vaccine: string }) => {
    const isGrippe = vaccine === 'Grippe';
    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold border
        ${isGrippe ? 'bg-white text-[#1d5998] border-[#b3bec5]' : 'bg-[#e7ebed] text-[#1d5998] border-[#b3bec5]'}`}
      >
        {vaccine}
      </span>
    );
  };

  const StatusDot = ({ status }: { status: 'en_retard' | 'bientot' }) => {
    const cls = status === 'en_retard' ? 'bg-red-500' : 'bg-orange-400';
    const label = status === 'en_retard' ? 'En retard' : 'Bientôt';
    return (
      <span className="inline-flex items-center gap-2 text-sm text-slate-700">
        <span className={`h-2.5 w-2.5 rounded-full ${cls}`} />
        <span className="font-medium">{label}</span>
      </span>
    );
  };

  return (
    <main className="min-h-screen bg-[#e7ebed] text-slate-900">
      <div className="flex">
        {/* Sidebar desktop */}
        <aside className="hidden md:block w-72 min-h-screen bg-white border-r border-[#b3bec5]/60 p-6">
          <div className="mb-7">
            <div className="text-xs uppercase tracking-wider text-slate-500">Dashboard</div>
            <div className="text-xl font-extrabold text-[#1d5998] leading-tight">Galop Tricastin</div>
            <div className="mt-2 text-sm text-slate-600">
              Suivi vaccinal <span className="font-semibold">Grippe</span> & <span className="font-semibold">Rhino</span>
            </div>
          </div>

          <nav>
            <div className="text-xs uppercase tracking-wider text-slate-500 mb-3">Navigation</div>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/horses"
                  className="block rounded-lg px-3 py-2 font-medium text-[#1d5998] hover:bg-[#e7ebed]"
                >
                  Chevaux
                </Link>
              </li>
              <li>
                <Link
                  href="/horses/new"
                  className="block rounded-lg px-3 py-2 font-medium text-[#1d5998] hover:bg-[#e7ebed]"
                >
                  Ajouter un cheval
                </Link>
              </li>
            </ul>
          </nav>

          <div className="mt-8 rounded-xl border border-[#b3bec5]/60 bg-[#e7ebed] p-4">
            <div className="text-xs uppercase tracking-wider text-slate-500">Résumé</div>
            <div className="mt-2 text-sm text-slate-700">
              <div className="flex justify-between">
                <span>Total chevaux</span>
                <span className="font-semibold">{totalHorses}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span>À jour</span>
                <span className="font-semibold">{upToDateCount}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <section className="flex-1">
          {/* HERO HEADER */}
          <header className="relative overflow-hidden bg-[#1d5998] text-white">
            <div className="px-4 sm:px-6 lg:px-10 pt-8 sm:pt-10 pb-12 sm:pb-14">
              <div className="text-sm/6 text-white/80">{format(new Date(), 'dd/MM/yyyy')}</div>

              <h1 className="mt-1 text-3xl sm:text-4xl font-extrabold tracking-tight">
                Centre de pilotage vaccins
              </h1>

              <p className="mt-2 text-white/85 max-w-2xl text-sm sm:text-base">
                Vision immédiate des rappels à venir et du niveau de conformité de l’élevage.
              </p>

              <div className="mt-6 flex flex-col sm:flex-row flex-wrap gap-3">
                <div className="rounded-xl bg-white/10 border border-white/20 px-4 py-3 w-full sm:w-auto">
                  <div className="text-xs uppercase tracking-wider text-white/75">Rappels</div>
                  <div className="text-2xl font-extrabold">{upcomingCount}</div>
                  <div className="text-sm text-white/80">en retard ou &lt; 30 jours</div>
                </div>

                <div className="rounded-xl bg-white/10 border border-white/20 px-4 py-3 w-full sm:w-auto">
                  <div className="text-xs uppercase tracking-wider text-white/75">Chevaux à jour</div>
                  <div className="text-2xl font-extrabold">{upToDatePercentage.toFixed(0)}%</div>
                  <div className="text-sm text-white/80">vaccinés cette année</div>
                </div>
              </div>
            </div>

            {/* vague */}
            <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 120" preserveAspectRatio="none">
              <path
                d="M0,80 C240,130 480,20 720,60 C960,100 1200,40 1440,70 L1440,120 L0,120 Z"
                fill="#e7ebed"
                opacity="1"
              />
            </svg>
          </header>

          {/* Content */}
          <div className="px-4 sm:px-6 lg:px-10 py-6 sm:py-10">
            {/* LIST — EN PREMIER */}
            <div className="rounded-2xl bg-white border border-[#b3bec5]/60 shadow-sm mb-8 sm:mb-10">
              <div className="p-5 sm:p-6 border-b border-[#b3bec5]/50">
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">À vacciner bientôt</h2>
                <p className="text-slate-600 mt-1 text-sm sm:text-base">
                  En retard en priorité, puis trié par date.
                </p>
              </div>

              <ul className="p-5 sm:p-6 space-y-3">
                {upcomingList.length > 0 ? (
                  upcomingList.map(item => (
                    <li key={item.id}>
                      {/* ✅ ligne cliquable vers la fiche */}
                      <Link
                        href={`/horses/${item.horseId}`}
                        className="block rounded-xl border border-[#b3bec5]/60 bg-[#e7ebed]/50 px-4 py-4 hover:bg-[#e7ebed] transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex flex-wrap items-center gap-3">
                            <StatusDot status={item.status} />
                            <div className="h-5 w-px bg-[#b3bec5]/70 hidden sm:block" />
                            <div className="font-semibold text-slate-900">{item.horseName}</div>
                            <VaccineBadge vaccine={item.vaccine} />
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-4">
                            <div className="text-sm text-slate-600">Échéance</div>
                            <div className="text-[#1d5998] font-extrabold text-lg">
                              {format(item.dueDate, 'dd/MM/yyyy')}
                            </div>
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))
                ) : (
                  <li className="text-slate-600">Aucun rappel à planifier dans les 30 jours.</li>
                )}
              </ul>
            </div>

            {/* CARDS — ENSUITE */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="rounded-2xl bg-white border border-[#b3bec5]/60 shadow-sm overflow-hidden">
                <div className="h-1.5 bg-[#1d5998]" />
                <div className="p-5 sm:p-6">
                  <div className="text-sm text-slate-500">Total chevaux</div>
                  <div className="mt-2 text-4xl font-extrabold text-slate-900">{totalHorses}</div>
                  <div className="mt-2 text-sm text-slate-600">enregistrés dans la base</div>
                </div>
              </div>

              <div className="rounded-2xl bg-white border border-[#b3bec5]/60 shadow-sm overflow-hidden">
                <div className="h-1.5 bg-[#1d5998]" />
                <div className="p-5 sm:p-6">
                  <div className="text-sm text-slate-500">Chevaux à jour</div>
                  <div className="mt-2 text-4xl font-extrabold text-slate-900">{upToDateCount}</div>
                  <div className="mt-2 text-sm text-slate-600">grippe + rhino à jour</div>
                </div>
              </div>

              <div className="rounded-2xl bg-white border border-[#b3bec5]/60 shadow-sm overflow-hidden sm:col-span-2 lg:col-span-1">
                <div className="h-1.5 bg-[#1d5998]" />
                <div className="p-5 sm:p-6">
                  <div className="text-sm text-slate-500">Actions prioritaires</div>
                  <div className="mt-2 text-4xl font-extrabold text-slate-900">{upcomingList.length}</div>
                  <div className="mt-2 text-sm text-slate-600">entrées dans la liste</div>
                </div>
              </div>
            </div>

            {/* Spacer anti-recouvrement (mobile) */}
            <div className="md:hidden h-28" />
          </div>

          {/* ✅ Bottom nav active (mobile) */}
          <BottomNav />
        </section>
      </div>
    </main>
  );
}