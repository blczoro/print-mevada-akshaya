
CREATE TABLE public.printers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT NOT NULL DEFAULT 'printnode',
  provider_printer_id TEXT NOT NULL,
  computer_id TEXT,
  computer_name TEXT,
  printer_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  connection_type TEXT,
  ip_address TEXT,
  port INTEGER,
  mac_address TEXT,
  driver_name TEXT,
  vendor TEXT,
  model TEXT,
  status TEXT NOT NULL DEFAULT 'unknown',
  capabilities JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_default BOOLEAN NOT NULL DEFAULT false,
  last_connected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_printer_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.printers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.printers TO authenticated;
GRANT ALL ON public.printers TO service_role;

ALTER TABLE public.printers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view printers" ON public.printers FOR SELECT USING (true);
CREATE POLICY "Anyone can manage printers" ON public.printers FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE public.print_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT NOT NULL DEFAULT 'printnode',
  provider_job_id TEXT,
  printer_id UUID REFERENCES public.printers(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.print_jobs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.print_jobs TO authenticated;
GRANT ALL ON public.print_jobs TO service_role;

ALTER TABLE public.print_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view print jobs" ON public.print_jobs FOR SELECT USING (true);
CREATE POLICY "Anyone can manage print jobs" ON public.print_jobs FOR ALL USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER printers_set_updated_at BEFORE UPDATE ON public.printers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER print_jobs_set_updated_at BEFORE UPDATE ON public.print_jobs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Ensure only one default printer at a time
CREATE OR REPLACE FUNCTION public.ensure_single_default_printer() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default THEN
    UPDATE public.printers SET is_default = false WHERE id <> NEW.id AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER printers_single_default AFTER INSERT OR UPDATE OF is_default ON public.printers
  FOR EACH ROW WHEN (NEW.is_default) EXECUTE FUNCTION public.ensure_single_default_printer();
