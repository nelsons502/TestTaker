-- Phase 4: Per-user test assignment + randomization storage

-- Add assigned_to column to tests (nullable = available to all public users)
ALTER TABLE public.tests ADD COLUMN assigned_to uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Update RLS: students can see public tests OR tests assigned specifically to them
DROP POLICY IF EXISTS "Anyone can read public tests" ON public.tests;
CREATE POLICY "Students can read accessible tests"
  ON public.tests FOR SELECT
  USING (
    is_public = true
    OR assigned_to = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Add randomization order storage to attempts
-- question_order: JSON array of question IDs in the randomized order
-- option_order: JSON object mapping question_id -> array of option IDs in randomized order
ALTER TABLE public.attempts ADD COLUMN question_order jsonb;
ALTER TABLE public.attempts ADD COLUMN option_order jsonb;
