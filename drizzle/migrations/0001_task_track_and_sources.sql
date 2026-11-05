ALTER TABLE public.tasks ADD COLUMN track text NOT NULL DEFAULT 'core';
ALTER TABLE public.tasks ADD COLUMN source_links text[] NOT NULL DEFAULT '{}';