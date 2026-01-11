import 'dotenv/config';

export const config = {
    // PumpPortal
    PUMPPORTAL_WS: 'wss://pumpportal.fun/api/data',
    PUMPPORTAL_TRADE: 'https://pumpportal.fun/api/trade-local',

    // Birdeye
    BIRDEYE_API_KEY: process.env.BIRDEYE_API_KEY,
    BIRDEYE_META: 'https://public-api.birdeye.so/defi/v3/token/meta-data/multiple',
    BIRDEYE_MARKET: 'https://public-api.birdeye.so/defi/v3/token/market-data/multiple',
    BIRDEYE_PRICE: 'https://public-api.birdeye.so/defi/price',

    // Helius
    HELIUS_API_KEY: process.env.HELIUS_API_KEY,
    HELIUS_RPC: `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`,

    // Claude
    CLAUDE_API_KEY: process.env.CLAUDE_API_KEY,

    // Supabase
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY,

    // Wallet
    WALLET_PRIVATE_KEY: process.env.WALLET_PRIVATE_KEY,

    // Server
    PORT: parseInt(process.env.PORT) || 3001,

    // Jak Config
    JAK_INITIAL_BALANCE: 0.5,
    JAK_DAILY_GOAL: 0.2,
    JAK_DISTRIBUTION_THRESHOLD: 1.0,
    JAK_MAX_POSITION_SIZE: 0.1,
    JAK_MAX_POSITIONS: 3
};

// Validacao
const required = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'BIRDEYE_API_KEY', 'HELIUS_API_KEY', 'CLAUDE_API_KEY'];
const missing = required.filter(k => !process.env[k]);
if (missing.length > 0) {
    console.error('[CONFIG] Variaveis faltando:', missing.join(', '));
    process.exit(1);
}
