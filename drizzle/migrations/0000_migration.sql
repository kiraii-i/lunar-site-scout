CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT '',
  team_role text CHECK (team_role IN ('GIS','PY','WEB')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team reads profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL DEFAULT '',
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  deliverables text NOT NULL DEFAULT '',
  owner_role text NOT NULL CHECK (owner_role IN ('GIS','PY','WEB')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('high','medium','low')),
  status text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo','in_progress','review','done')),
  due_date date,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT ALL ON public.tasks TO service_role;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team reads tasks" ON public.tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "team inserts tasks" ON public.tasks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "team updates tasks" ON public.tasks FOR UPDATE TO authenticated USING (true);
CREATE POLICY "team deletes tasks" ON public.tasks FOR DELETE TO authenticated USING (true);

CREATE TABLE public.activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  actor_name text NOT NULL DEFAULT '',
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.activity TO authenticated;
GRANT ALL ON public.activity TO service_role;
ALTER TABLE public.activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team reads activity" ON public.activity FOR SELECT TO authenticated USING (true);
CREATE POLICY "team writes own activity" ON public.activity FOR INSERT TO authenticated WITH CHECK (auth.uid() = actor_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity;

INSERT INTO public.tasks (code,title,owner_role,priority,due_date,deliverables) VALUES
('GIS-01','Collect LOLA DEM and metadata for both study areas','GIS','high','2026-11-06','DEM files + metadata sheet (source, frame, resolution)'),
('GIS-02','Generate hillshade, slope, and aspect products','GIS','high','2026-11-07','Hillshade/slope/aspect rasters'),
('GIS-03','Build local horizon profile (360 directions, 1° increments) for verified reference point(s), if feasible','GIS','high','2026-11-09','horizon_profile.csv (azimuth_deg, horizon_elev_deg)'),
('GIS-04','Compare Python Sun/Earth azimuth/elevation against matching local horizon for terrain occlusion','GIS','medium','2026-11-10','Occlusion comparison notes'),
('GIS-05','Prepare map-ready layers and metadata package','GIS','medium','2026-11-11','Tiles/GeoTIFFs + metadata JSON'),
('GIS-06','Document candidate-area screening criteria and limitations','GIS','medium','2026-11-12','Criteria + limitations doc'),
('PY-01','Set up Python environment and dependencies','PY','high','2026-11-06','requirements.txt, env instructions'),
('PY-02','Acquire/document SPICE kernels and reference frames','PY','high','2026-11-07','Kernel list with provenance'),
('PY-03','Compute Sun position at selected site/time','PY','high','2026-11-08','Function + test output'),
('PY-04','Compute Earth position at selected site/time','PY','high','2026-11-08','Function + test output'),
('PY-05','Compute elevation, azimuth, and geometric visibility','PY','high','2026-11-09','elev/az module'),
('PY-06','Generate UTC time-series/timeline','PY','medium','2026-11-10','Timeline JSON'),
('PY-07','Integrate verified GIS horizon profile','PY','medium','2026-11-11','terrain_visible flags'),
('PY-08','Expose documented JSON/API output','PY','medium','2026-11-12','FastAPI endpoints + schema doc'),
('WEB-01','Build dashboard and navigation','WEB','high','2026-11-06','Dashboard + nav'),
('WEB-02','Build task board and shared persistence','WEB','high','2026-11-07','Shared task board'),
('WEB-03','Build GIS Explorer and layer controls','WEB','high','2026-11-08','GIS Explorer page'),
('WEB-04','Build scientific analysis and timeline views','WEB','medium','2026-11-09','Analysis + timeline pages'),
('WEB-05','Build site comparison and sources pages','WEB','medium','2026-11-10','Comparison + resources pages'),
('WEB-06','Integrate Python API and GIS outputs','WEB','medium','2026-11-11','Live data wiring'),
('WEB-07','Responsive QA, presentation, screenshots, demo video backup','WEB','medium','2026-11-12','Slides, screenshots, demo video');
UPDATE public.tasks SET status='in_progress' WHERE code IN ('WEB-01','WEB-02');