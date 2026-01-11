-- ═══════════════════════════════════════════════════════════════
-- FIX REALTIME - Executar depois do schema
-- ═══════════════════════════════════════════════════════════════

-- Remover e re-adicionar
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.jak_status;
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.tokens;
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.trades;
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.positions;
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.jak_thoughts;
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.distributions;

-- REPLICA IDENTITY (obrigatorio para UPDATE/DELETE realtime)
ALTER TABLE public.jak_status REPLICA IDENTITY FULL;
ALTER TABLE public.tokens REPLICA IDENTITY FULL;
ALTER TABLE public.trades REPLICA IDENTITY FULL;
ALTER TABLE public.positions REPLICA IDENTITY FULL;
ALTER TABLE public.jak_thoughts REPLICA IDENTITY FULL;
ALTER TABLE public.distributions REPLICA IDENTITY FULL;

-- Adicionar ao realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.jak_status;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tokens;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trades;
ALTER PUBLICATION supabase_realtime ADD TABLE public.positions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.jak_thoughts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.distributions;

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

-- Policies para insert/update (service role)
DROP POLICY IF EXISTS "service_write" ON public.jak_status;
DROP POLICY IF EXISTS "service_write" ON public.tokens;
DROP POLICY IF EXISTS "service_write" ON public.trades;
DROP POLICY IF EXISTS "service_write" ON public.positions;
DROP POLICY IF EXISTS "service_write" ON public.jak_thoughts;
DROP POLICY IF EXISTS "service_write" ON public.distributions;

CREATE POLICY "service_write" ON public.jak_status FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_write" ON public.tokens FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_write" ON public.trades FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_write" ON public.positions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_write" ON public.jak_thoughts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_write" ON public.distributions FOR ALL USING (true) WITH CHECK (true);
