
CREATE TABLE public.moments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.moments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own moments"
  ON public.moments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own moments"
  ON public.moments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own moments"
  ON public.moments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own moments"
  ON public.moments FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_moments_user_date ON public.moments(user_id, date DESC);
