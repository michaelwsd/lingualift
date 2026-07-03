-- Adds an optional unlock date to homework assignments, used by student-created
-- practice plans so each day's exercise unlocks one day after the previous.
-- Run this once in the Supabase SQL editor. The app degrades gracefully until then
-- (plans still generate; day-gating just won't apply until the column exists).

alter table public.homework_assignments
  add column if not exists unlock_date timestamptz;
