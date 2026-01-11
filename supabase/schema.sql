-- ═══════════════════════════════════════════════════════════════
-- JAK AGENT - SUPABASE SCHEMA
-- ═══════════════════════════════════════════════════════════════

-- Jak Status (estado principal do bot)
CREATE TABLE IF NOT EXISTS jak_status (
    id INT PRIMARY KEY DEFAULT 1,
    status TEXT DEFAULT 'OFFLINE',
    wallet_address TEXT,
    balance_sol DECIMAL(20, 9) DEFAULT 0,
    initial_balance DECIMAL(20, 9) DEFAULT 0.5,
    today_pnl DECIMAL(20, 9) DEFAULT 0,
    total_pnl DECIMAL(20, 9) DEFAULT 0,
    daily_goal DECIMAL(20, 9) DEFAULT 0.2,
    total_trades INT DEFAULT 0,
    wins INT DEFAULT 0,
    losses INT DEFAULT 0,
    win_rate DECIMAL(5, 2) DEFAULT 0,
    mood TEXT DEFAULT 'Neutral',
    mood_score INT DEFAULT 50,
    mode TEXT DEFAULT 'Normal',
    last_thought TEXT DEFAULT ':| Starting...',
    consecutive_losses INT DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO jak_status (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Tokens analisados
CREATE TABLE IF NOT EXISTS tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ca TEXT UNIQUE NOT NULL,
    name TEXT,
    symbol TEXT,
    logo TEXT,
    market_cap DECIMAL(20, 2),
    price DECIMAL(30, 18),
    liquidity DECIMAL(20, 2),
    holders INT,
    volume_24h DECIMAL(20, 2),
    jak_score INT,
    jak_decision TEXT,
    jak_reasoning TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trades executados
CREATE TABLE IF NOT EXISTS trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_ca TEXT REFERENCES tokens(ca),
    type TEXT NOT NULL,
    amount_sol DECIMAL(20, 9),
    price DECIMAL(30, 18),
    pnl_sol DECIMAL(20, 9),
    tx_signature TEXT,
    mood TEXT,
    jak_score INT,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Posicoes abertas
CREATE TABLE IF NOT EXISTS positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_ca TEXT REFERENCES tokens(ca),
    status TEXT DEFAULT 'open',
    amount_sol DECIMAL(20, 9),
    entry_price DECIMAL(30, 18),
    current_price DECIMAL(30, 18),
    pnl_percent DECIMAL(10, 2),
    pnl_sol DECIMAL(20, 9),
    jak_score INT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    closed_at TIMESTAMPTZ
);

-- Pensamentos do Jak (log de raciocinio)
CREATE TABLE IF NOT EXISTS jak_thoughts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL,
    token_ca TEXT,
    token_symbol TEXT,
    thought TEXT NOT NULL,
    mood TEXT,
    score INT,
    decision TEXT,
    pnl DECIMAL(20, 9),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Distribuicoes para holders
CREATE TABLE IF NOT EXISTS distributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    amount_sol DECIMAL(20, 9),
    total_pnl_at_distribution DECIMAL(20, 9),
    tx_signature TEXT,
    mood TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_tokens_ca ON tokens(ca);
CREATE INDEX IF NOT EXISTS idx_trades_created ON trades(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_positions_status ON positions(status);
CREATE INDEX IF NOT EXISTS idx_thoughts_created ON jak_thoughts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_thoughts_type ON jak_thoughts(type);
