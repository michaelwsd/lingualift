-- Adds an optional soft due date to homework assignments.
-- Run this once in the Supabase SQL editor (Dashboard → SQL Editor → New query).
-- The app degrades gracefully until this is applied: sending/listing homework keeps
-- working, and due dates simply start persisting once the column exists.

alter table public.homework_assignments
  add column if not exists due_date timestamptz;
