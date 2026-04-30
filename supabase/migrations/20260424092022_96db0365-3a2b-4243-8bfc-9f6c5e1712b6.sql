-- Roles enum + table (separate, to avoid privilege escalation)
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Generic updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own profile" ON public.profiles FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile + default role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Tours catalog
CREATE TABLE public.tours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  city TEXT NOT NULL,
  era TEXT NOT NULL,
  duration TEXT NOT NULL,
  stops INTEGER NOT NULL DEFAULT 0,
  rating NUMERIC(2,1) NOT NULL DEFAULT 0,
  image_url TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tours readable by everyone" ON public.tours FOR SELECT USING (true);
CREATE POLICY "Admins insert tours" ON public.tours FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update tours" ON public.tours FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete tours" ON public.tours FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_tours_updated_at BEFORE UPDATE ON public.tours
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_tours_city ON public.tours(city);

-- User progress per tour
CREATE TABLE public.tour_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tour_id UUID NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  completed BOOLEAN NOT NULL DEFAULT false,
  last_visited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, tour_id)
);
ALTER TABLE public.tour_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own progress" ON public.tour_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own progress" ON public.tour_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own progress" ON public.tour_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own progress" ON public.tour_progress FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER trg_tour_progress_updated_at BEFORE UPDATE ON public.tour_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_tour_progress_user ON public.tour_progress(user_id);

-- Seed tours
INSERT INTO public.tours (slug, title, city, era, duration, stops, rating, image_url) VALUES
  ('rome', 'Glory of the Colosseum', 'Rome, Italy', '80 AD', '1h 20m', 6, 4.9, 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&q=80'),
  ('athens', 'Birthplace of Democracy', 'Athens, Greece', '5th c. BC', '2h', 8, 4.8, 'https://images.unsplash.com/photo-1555993539-1732b0258235?w=800&q=80'),
  ('egypt', 'Pharaohs of Giza', 'Cairo, Egypt', '2560 BC', '1h 45m', 5, 4.9, 'https://images.unsplash.com/photo-1539768942893-daf53e448371?w=800&q=80'),
  ('kyoto', 'Samurai Streets', 'Kyoto, Japan', '1603', '1h 30m', 7, 4.7, 'https://images.unsplash.com/photo-1493997181344-712f2f19d87a?w=800&q=80'),
  ('machu', 'Lost City of the Incas', 'Machu Picchu, Peru', '1450', '2h 15m', 9, 5.0, 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=800&q=80'),
  ('petra', 'Rose City Mysteries', 'Petra, Jordan', '300 BC', '1h 50m', 6, 4.8, 'https://images.unsplash.com/photo-1563177682-7e64c34cb2b9?w=800&q=80');