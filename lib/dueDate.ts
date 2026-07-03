// Helpers for the optional (soft) homework due date. Overdue is flagged but the
// homework always stays usable.

export type DueTone = 'overdue' | 'today' | 'soon' | 'later' | 'done';

export interface DueInfo {
  label: string;
  tone: DueTone;
}

/** "3 Jul 2026" */
export function formatDueDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** For a native <input type="date"> value (yyyy-mm-dd). */
export function toDateInputValue(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

/** A date-input yyyy-mm-dd string → ISO at end of that local day (so "due today" isn't instantly overdue). */
export function dateInputToDueIso(value: string): string | null {
  if (!value) return null;
  const d = new Date(`${value}T23:59:59`);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/**
 * A short human status for a due date, relative to today.
 * `completed` mutes the status to a neutral "done" tone.
 */
export function dueInfo(iso: string | null | undefined, completed = false): DueInfo | null {
  if (!iso) return null;
  const due = new Date(iso);
  if (isNaN(due.getTime())) return null;

  if (completed) return { label: `Due ${formatDueDate(iso)}`, tone: 'done' };

  const today = startOfDay(new Date());
  const dueDay = startOfDay(due);
  const days = Math.round((dueDay - today) / 86400000);

  if (days < 0) return { label: days === -1 ? 'Overdue by 1 day' : `Overdue by ${-days} days`, tone: 'overdue' };
  if (days === 0) return { label: 'Due today', tone: 'today' };
  if (days === 1) return { label: 'Due tomorrow', tone: 'soon' };
  if (days <= 3) return { label: `Due in ${days} days`, tone: 'soon' };
  return { label: `Due ${formatDueDate(iso)}`, tone: 'later' };
}

/** Tailwind classes for a due-status pill. */
export const DUE_TONE_CLASSES: Record<DueTone, string> = {
  overdue: 'bg-red-50 text-red-700 border-red-200',
  today: 'bg-orange-50 text-orange-700 border-orange-200',
  soon: 'bg-amber-50 text-amber-700 border-amber-200',
  later: 'bg-stone-100 text-stone-500 border-stone-200',
  done: 'bg-stone-100 text-stone-400 border-stone-200',
};
