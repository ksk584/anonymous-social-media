-- Create reports table
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_reports_post_id ON public.reports(post_id);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.reports(created_at DESC);

-- Enable RLS for reports
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view reports
DROP POLICY IF EXISTS "reports_select_all" ON public.reports;
CREATE POLICY "reports_select_all" ON public.reports FOR SELECT USING (true);

-- Allow anyone to insert reports
DROP POLICY IF EXISTS "reports_insert_all" ON public.reports;
CREATE POLICY "reports_insert_all" ON public.reports FOR INSERT WITH CHECK (true);

-- Allow anyone to delete reports
DROP POLICY IF EXISTS "reports_delete_all" ON public.reports;
CREATE POLICY "reports_delete_all" ON public.reports FOR DELETE USING (true);
