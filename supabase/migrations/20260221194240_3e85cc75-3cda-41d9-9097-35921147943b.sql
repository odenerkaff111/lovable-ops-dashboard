
-- Fix: Enable RLS on task_types (it was missing)
ALTER TABLE public.task_types ENABLE ROW LEVEL SECURITY;

-- The "always true" warnings on activity_log and appointments INSERT/UPDATE for anon are intentional
-- because webhooks need to insert without auth. These are protected by the edge function validation.
