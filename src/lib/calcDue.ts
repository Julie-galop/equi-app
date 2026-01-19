import { addDays, addMonths, addYears, startOfDay } from 'date-fns';

const SOON_DAYS = 30;

export type DueStatus = 'a_faire' | 'en_retard' | 'bientot' | 'a_jour';

/**
 * Règles FFE (primo) :
 * - 1ère injection -> +1 mois
 * - 2ème injection -> +6 mois
 * - 3ème injection et suivantes -> +1 an
 *
 * On se base sur la DERNIERE date connue, et sur le nombre total d'injections.
 */
export function nextDueDate(dates: Date[]): Date | null {
  const valid = (dates ?? []).filter(d => d instanceof Date && !Number.isNaN(d.getTime()));
  if (valid.length === 0) return null;

  // Dernière injection (la plus récente)
  const last = valid.reduce((acc, d) => (d.getTime() > acc.getTime() ? d : acc), valid[0]);

  if (valid.length === 1) return addMonths(last, 1);
  if (valid.length === 2) return addMonths(last, 6);
  return addYears(last, 1);
}

/**
 * Statut selon l'échéance :
 * - null => a_faire
 * - échéance passée => en_retard
 * - échéance dans < SOON_DAYS => bientot
 * - sinon => a_jour
 */
export function getStatus(due: Date | null): DueStatus {
  if (!due) return 'a_faire';

  const today = startOfDay(new Date());
  const dueDay = startOfDay(due);

  const diffMs = dueDay.getTime() - today.getTime();

  if (diffMs < 0) return 'en_retard';
  if (diffMs <= SOON_DAYS * 24 * 60 * 60 * 1000) return 'bientot';
  return 'a_jour';
}

/** Optionnel : utile si tu veux afficher "dans X jours" */
export function daysUntil(due: Date | null): number | null {
  if (!due) return null;
  const today = startOfDay(new Date());
  const dueDay = startOfDay(due);
  return Math.ceil((dueDay.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
}