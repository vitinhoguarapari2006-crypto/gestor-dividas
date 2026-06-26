-- ============================================================
-- GESTOR DE DÍVIDAS — Schema Supabase
-- Cole este SQL no editor SQL do seu projeto Supabase
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABELA: dividas
-- ============================================================
CREATE TABLE public.dividas (
  id               UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome             TEXT          NOT NULL,
  credor           TEXT,
  valor_total      NUMERIC(12,2) NOT NULL DEFAULT 0,
  valor_parcela    NUMERIC(12,2) NOT NULL,
  total_parcelas   INTEGER       NOT NULL CHECK (total_parcelas > 0),
  parcelas_pagas   INTEGER       NOT NULL DEFAULT 0 CHECK (parcelas_pagas >= 0),
  dia_vencimento   INTEGER       NOT NULL CHECK (dia_vencimento >= 1 AND dia_vencimento <= 31),
  data_inicio      DATE          NOT NULL,
  categoria        TEXT          NOT NULL DEFAULT 'outros',
  status           TEXT          NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa', 'quitada')),
  observacoes      TEXT,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT parcelas_validas CHECK (parcelas_pagas <= total_parcelas)
);

-- ============================================================
-- TABELA: pagamentos
-- ============================================================
CREATE TABLE public.pagamentos (
  id               UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  divida_id        UUID          NOT NULL REFERENCES public.dividas(id) ON DELETE CASCADE,
  numero_parcela   INTEGER       NOT NULL,
  valor_pago       NUMERIC(12,2) NOT NULL,
  data_pagamento   DATE          NOT NULL DEFAULT CURRENT_DATE,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX idx_dividas_user_id   ON public.dividas(user_id);
CREATE INDEX idx_dividas_status    ON public.dividas(status);
CREATE INDEX idx_pag_user_id       ON public.pagamentos(user_id);
CREATE INDEX idx_pag_divida_id     ON public.pagamentos(divida_id);

-- ============================================================
-- ROW LEVEL SECURITY — dividas
-- ============================================================
ALTER TABLE public.dividas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dividas_select" ON public.dividas
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "dividas_insert" ON public.dividas
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "dividas_update" ON public.dividas
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "dividas_delete" ON public.dividas
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- ROW LEVEL SECURITY — pagamentos
-- ============================================================
ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pagamentos_select" ON public.pagamentos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "pagamentos_insert" ON public.pagamentos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "pagamentos_update" ON public.pagamentos
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "pagamentos_delete" ON public.pagamentos
  FOR DELETE USING (auth.uid() = user_id);
