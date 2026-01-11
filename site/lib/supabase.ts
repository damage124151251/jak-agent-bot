import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types
export interface JakStatus {
    id: number
    status: string
    wallet_address: string
    balance_sol: number
    initial_balance: number
    today_pnl: number
    total_pnl: number
    daily_goal: number
    total_trades: number
    wins: number
    losses: number
    win_rate: number
    mood: string
    mood_score: number
    mode: string
    last_thought: string
    consecutive_losses: number
    updated_at: string
}

export interface JakThought {
    id: string
    type: string
    token_ca?: string
    token_symbol?: string
    thought: string
    mood: string
    score?: number
    decision?: string
    pnl?: number
    created_at: string
}

export interface Trade {
    id: string
    token_ca: string
    type: string
    amount_sol: number
    price: number
    pnl_sol?: number
    tx_signature: string
    mood: string
    jak_score?: number
    reason?: string
    created_at: string
    tokens?: {
        name: string
        symbol: string
        logo?: string
    }
}

export interface Position {
    id: string
    token_ca: string
    status: string
    amount_sol: number
    entry_price: number
    current_price: number
    pnl_percent: number
    pnl_sol: number
    jak_score: number
    created_at: string
    tokens?: {
        name: string
        symbol: string
        logo?: string
    }
}

// Fetch functions
export async function getJakStatus(): Promise<JakStatus | null> {
    const { data } = await supabase.from('jak_status').select('*').eq('id', 1).single()
    return data
}

export async function getRecentThoughts(limit = 20): Promise<JakThought[]> {
    const { data } = await supabase
        .from('jak_thoughts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)
    return data || []
}

export async function getOpenPositions(): Promise<Position[]> {
    const { data } = await supabase
        .from('positions')
        .select('*, tokens(*)')
        .eq('status', 'open')
        .order('created_at', { ascending: false })
    return data || []
}

export async function getRecentTrades(limit = 50): Promise<Trade[]> {
    const { data } = await supabase
        .from('trades')
        .select('*, tokens(*)')
        .order('created_at', { ascending: false })
        .limit(limit)
    return data || []
}

export async function getTotalDistributed(): Promise<number> {
    const { data } = await supabase.from('distributions').select('amount_sol')
    return data?.reduce((acc, d) => acc + parseFloat(d.amount_sol || '0'), 0) || 0
}
