-- ═══════════════════════════════════════════════════════════════
-- FIX REALTIME - Executar depois do schema
-- ═══════════════════════════════════════════════════════════════

-- REPLICA IDENTITY (obrigatorio para UPDATE/DELETE realtime)
ALTER TABLE public.jak_status REPLICA IDENTITY FULL;
ALTER TABLE public.tokens REPLICA IDENTITY FULL;
ALTER TABLE public.trades REPLICA IDENTITY FULL;
ALTER TABLE public.positions REPLICA IDENTITY FULL;
ALTER TABLE public.jak_thoughts REPLICA IDENTITY FULL;
ALTER TABLE public.distributions REPLICA IDENTITY FULL;

-- Adicionar ao realtime (ignora erro se ja existe)
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.jak_status;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tokens;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.trades;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.positions;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.jak_thoughts;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.distributions;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- RLS
ALTER TABLE public.jak_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jak_thoughts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.distributions ENABLE ROW LEVEL SECURITY;

-- Policies para leitura publica
DROP POLICY IF EXISTS "public_read" ON public.jak_status;
DROP POLICY IF EXISTS "public_read" ON public.tokens;
DROP POLICY IF EXISTS "public_read" ON public.trades;
DROP POLICY IF EXISTS "public_read" ON public.positions;
DROP POLICY IF EXISTS "public_read" ON public.jak_thoughts;
DROP POLICY IF EXISTS "public_read" ON public.distributions;

CREATE POLICY "public_read" ON public.jak_status FOR SELECT USING (true);
CREATE POLICY "public_read" ON public.tokens FOR SELECT USING (true);
CREATE POLICY "public_read" ON public.trades FOR SELECT USING (true);
CREATE POLICY "public_read" ON public.positions FOR SELECT USING (true);
CREATE POLICY "public_read" ON public.jak_thoughts FOR SELECT USING (true);
CREATE POLICY "public_read" ON public.distributions FOR SELECT USING (true);

-- Policies para insert/update (permite tudo - bot usa service key)
DROP POLICY IF EXISTS "allow_all" ON public.jak_status;
DROP POLICY IF EXISTS "allow_all" ON public.tokens;
DROP POLICY IF EXISTS "allow_all" ON public.trades;
DROP POLICY IF EXISTS "allow_all" ON public.positions;
DROP POLICY IF EXISTS "allow_all" ON public.jak_thoughts;
DROP POLICY IF EXISTS "allow_all" ON public.distributions;

CREATE POLICY "allow_all" ON public.jak_status FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON public.tokens FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON public.trades FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON public.positions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON public.jak_thoughts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON public.distributions FOR ALL USING (true) WITH CHECK (true);
