'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase, JakStatus, JakThought, Position, Trade, getJakStatus, getRecentThoughts, getOpenPositions, getRecentTrades, getTotalDistributed } from '@/lib/supabase'

// Mood ASCII faces
const MOOD_FACES: Record<string, string> = {
    'Euphoric': '(   ^_^   )',
    'Happy': '(   :)    )',
    'Neutral': '(   :|    )',
    'Worried': '(   :/    )',
    'Doomer': '(   :(    )',
    'Pink Wojak': '(   X_X   )'
}

const MOOD_COLORS: Record<string, string> = {
    'Euphoric': 'text-jak-green',
    'Happy': 'text-jak-green',
    'Neutral': 'text-jak-light',
    'Worried': 'text-jak-yellow',
    'Doomer': 'text-jak-red',
    'Pink Wojak': 'text-jak-red'
}

export default function Home() {
    const [jakStatus, setJakStatus] = useState<JakStatus | null>(null)
    const [thoughts, setThoughts] = useState<JakThought[]>([])
    const [positions, setPositions] = useState<Position[]>([])
    const [trades, setTrades] = useState<Trade[]>([])
    const [distributed, setDistributed] = useState(0)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadData()

        // Realtime subscriptions
        const statusChannel = supabase
            .channel('jak_status_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'jak_status' }, () => {
                loadJakStatus()
            })
            .subscribe()

        const thoughtsChannel = supabase
            .channel('thoughts_changes')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'jak_thoughts' }, (payload) => {
                setThoughts(prev => [payload.new as JakThought, ...prev.slice(0, 19)])
            })
            .subscribe()

        const positionsChannel = supabase
            .channel('positions_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'positions' }, () => {
                loadPositions()
            })
            .subscribe()

        const tradesChannel = supabase
            .channel('trades_changes')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'trades' }, () => {
                loadTrades()
            })
            .subscribe()

        // Poll for updates
        const interval = setInterval(loadData, 30000)

        return () => {
            statusChannel.unsubscribe()
            thoughtsChannel.unsubscribe()
            positionsChannel.unsubscribe()
            tradesChannel.unsubscribe()
            clearInterval(interval)
        }
    }, [])

    async function loadData() {
        await Promise.all([
            loadJakStatus(),
            loadThoughts(),
            loadPositions(),
            loadTrades(),
            loadDistributed()
        ])
        setLoading(false)
    }

    async function loadJakStatus() {
        const status = await getJakStatus()
        setJakStatus(status)
    }

    async function loadThoughts() {
        const data = await getRecentThoughts(20)
        setThoughts(data)
    }

    async function loadPositions() {
        const data = await getOpenPositions()
        setPositions(data)
    }

    async function loadTrades() {
        const data = await getRecentTrades(20)
        setTrades(data)
    }

    async function loadDistributed() {
        const total = await getTotalDistributed()
        setDistributed(total)
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="mood-face mb-4">(  ?_?  )</div>
                    <p className="text-xl">Loading Jak...</p>
                    <span className="blink">_</span>
                </div>
            </div>
        )
    }

    const mood = jakStatus?.mood || 'Neutral'
    const moodFace = MOOD_FACES[mood] || MOOD_FACES['Neutral']
    const moodColor = MOOD_COLORS[mood] || 'text-jak-light'

    return (
        <main className="min-h-screen p-4 md:p-8">
            {/* Header */}
            <header className="text-center mb-8">
                <motion.h1
                    className="text-4xl md:text-6xl font-bold meme-text mb-2"
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                >
                    JAK AGENT
                </motion.h1>
                <p className="text-jak-light text-lg">wojak trader bot</p>
            </header>

            {/* Main Grid */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column - Jak Status */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Mood Card */}
                    <motion.div
                        className="wojak-card p-6 text-center"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                    >
                        <div className={`mood-face ${moodColor} mb-4`}>
                            {moodFace}
                        </div>
                        <h2 className="text-2xl font-bold mb-2">{mood}</h2>
                        <div className="text-sm text-jak-light">
                            Mood Score: {jakStatus?.mood_score || 50}/100
                        </div>
                        <div className="mt-2 w-full bg-jak-gray h-2 rounded">
                            <div
                                className={`h-full rounded ${jakStatus?.mood_score && jakStatus.mood_score > 50 ? 'bg-jak-green' : 'bg-jak-red'}`}
                                style={{ width: `${jakStatus?.mood_score || 50}%` }}
                            />
                        </div>
                        <div className="mt-4 text-sm">
                            Mode: <span className="font-bold">{jakStatus?.mode || 'Normal'}</span>
                        </div>
                    </motion.div>

                    {/* Thought Bubble */}
                    <motion.div
                        className="thought-bubble"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={jakStatus?.last_thought}
                    >
                        <p className="text-lg italic">"{jakStatus?.last_thought || '...'}"</p>
                    </motion.div>

                    {/* Stats */}
                    <div className="wojak-card p-4 space-y-3">
                        <div className="flex justify-between">
                            <span>Status</span>
                            <span className={jakStatus?.status === 'TRADING' ? 'text-jak-green' : 'text-jak-red'}>
                                {jakStatus?.status || 'OFFLINE'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span>Balance</span>
                            <span className="font-bold">{(jakStatus?.balance_sol || 0).toFixed(4)} SOL</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Today PnL</span>
                            <span className={jakStatus?.today_pnl && jakStatus.today_pnl >= 0 ? 'pnl-positive' : 'pnl-negative'}>
                                {jakStatus?.today_pnl && jakStatus.today_pnl >= 0 ? '+' : ''}{(jakStatus?.today_pnl || 0).toFixed(4)} SOL
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span>Total PnL</span>
                            <span className={jakStatus?.total_pnl && jakStatus.total_pnl >= 0 ? 'pnl-positive' : 'pnl-negative'}>
                                {jakStatus?.total_pnl && jakStatus.total_pnl >= 0 ? '+' : ''}{(jakStatus?.total_pnl || 0).toFixed(4)} SOL
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span>Daily Goal</span>
                            <span>{(jakStatus?.daily_goal || 0.2).toFixed(2)} SOL</span>
                        </div>
                        <div className="border-t border-jak-gray pt-3 flex justify-between">
                            <span>Distributed</span>
                            <span className="text-jak-green">{distributed.toFixed(2)} SOL</span>
                        </div>
                    </div>

                    {/* Win/Loss */}
                    <div className="wojak-card p-4">
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <div className="text-2xl font-bold">{jakStatus?.total_trades || 0}</div>
                                <div className="text-sm text-jak-light">Trades</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-jak-green">{jakStatus?.wins || 0}</div>
                                <div className="text-sm text-jak-light">Wins</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-jak-red">{jakStatus?.losses || 0}</div>
                                <div className="text-sm text-jak-light">Losses</div>
                            </div>
                        </div>
                        <div className="mt-4 text-center">
                            <span className="text-xl font-bold">
                                {(jakStatus?.win_rate || 0).toFixed(1)}% Win Rate
                            </span>
                        </div>
                    </div>

                    {/* Wallet */}
                    {jakStatus?.wallet_address && (
                        <div className="wojak-card p-4">
                            <div className="text-sm text-jak-light mb-1">Wallet</div>
                            <div className="font-mono text-xs break-all">
                                {jakStatus.wallet_address}
                            </div>
                        </div>
                    )}
                </div>

                {/* Middle Column - Thoughts Feed */}
                <div className="lg:col-span-1">
                    <div className="wojak-card p-4 h-full">
                        <h3 className="text-xl font-bold mb-4 meme-text">JAK'S BRAIN</h3>
                        <div className="space-y-3 max-h-[600px] overflow-y-auto">
                            <AnimatePresence>
                                {thoughts.map((thought, index) => (
                                    <motion.div
                                        key={thought.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="p-3 bg-jak-gray rounded border border-jak-light/20"
                                    >
                                        <div className="flex items-start justify-between mb-1">
                                            <span className={`text-xs px-2 py-0.5 rounded ${
                                                thought.type === 'buy' ? 'bg-jak-green/20 text-jak-green' :
                                                thought.type === 'sell' ? 'bg-jak-red/20 text-jak-red' :
                                                'bg-jak-gray text-jak-light'
                                            }`}>
                                                {thought.type.toUpperCase()}
                                            </span>
                                            <span className="text-xs text-jak-light">
                                                {new Date(thought.created_at).toLocaleTimeString()}
                                            </span>
                                        </div>
                                        {thought.token_symbol && (
                                            <div className="text-sm text-jak-light mb-1">
                                                ${thought.token_symbol}
                                            </div>
                                        )}
                                        <p className="text-sm">"{thought.thought}"</p>
                                        {thought.score !== undefined && (
                                            <div className="mt-1 text-xs text-jak-light">
                                                Score: {thought.score} | {thought.decision}
                                            </div>
                                        )}
                                        {thought.pnl !== undefined && thought.pnl !== null && (
                                            <div className={`mt-1 text-xs font-bold ${thought.pnl >= 0 ? 'pnl-positive' : 'pnl-negative'}`}>
                                                {thought.pnl >= 0 ? '+' : ''}{thought.pnl.toFixed(4)} SOL
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            {thoughts.length === 0 && (
                                <div className="text-center text-jak-light py-8">
                                    Jak is thinking...<span className="blink">_</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column - Positions & Trades */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Open Positions */}
                    <div className="wojak-card p-4">
                        <h3 className="text-xl font-bold mb-4 meme-text">OPEN POSITIONS</h3>
                        <div className="space-y-3">
                            {positions.map(position => (
                                <motion.div
                                    key={position.id}
                                    className="p-3 bg-jak-gray rounded border border-jak-light/20"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="font-bold">
                                                ${position.tokens?.symbol || position.token_ca.slice(0, 8)}
                                            </div>
                                            <div className="text-xs text-jak-light">
                                                {position.amount_sol.toFixed(4)} SOL
                                            </div>
                                        </div>
                                        <div className={`text-right ${position.pnl_percent >= 0 ? 'pnl-positive' : 'pnl-negative'}`}>
                                            <div className="font-bold">
                                                {position.pnl_percent >= 0 ? '+' : ''}{position.pnl_percent?.toFixed(1) || 0}%
                                            </div>
                                            <div className="text-xs">
                                                {position.pnl_sol && position.pnl_sol >= 0 ? '+' : ''}{(position.pnl_sol || 0).toFixed(4)} SOL
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-2 text-xs text-jak-light">
                                        Score: {position.jak_score}
                                    </div>
                                </motion.div>
                            ))}
                            {positions.length === 0 && (
                                <div className="text-center text-jak-light py-4">
                                    No open positions
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recent Trades */}
                    <div className="wojak-card p-4">
                        <h3 className="text-xl font-bold mb-4 meme-text">TRADE HISTORY</h3>
                        <div className="space-y-2 max-h-[400px] overflow-y-auto">
                            {trades.map(trade => (
                                <div
                                    key={trade.id}
                                    className="p-2 bg-jak-gray rounded text-sm flex justify-between items-center"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className={`px-1.5 py-0.5 rounded text-xs ${
                                            trade.type === 'buy' ? 'bg-jak-green/20 text-jak-green' : 'bg-jak-red/20 text-jak-red'
                                        }`}>
                                            {trade.type.toUpperCase()}
                                        </span>
                                        <span>${trade.tokens?.symbol || trade.token_ca.slice(0, 6)}</span>
                                    </div>
                                    <div className="text-right">
                                        <div>{trade.amount_sol.toFixed(4)} SOL</div>
                                        {trade.pnl_sol !== null && trade.pnl_sol !== undefined && (
                                            <div className={`text-xs ${trade.pnl_sol >= 0 ? 'pnl-positive' : 'pnl-negative'}`}>
                                                {trade.pnl_sol >= 0 ? '+' : ''}{trade.pnl_sol.toFixed(4)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {trades.length === 0 && (
                                <div className="text-center text-jak-light py-4">
                                    No trades yet
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="text-center mt-12 pb-8 text-jak-light text-sm">
                <div className="mb-2">
                    <a href="/privacy" className="hover:text-jak-white mx-2">Privacy</a>
                    <span>|</span>
                    <a href="/terms" className="hover:text-jak-white mx-2">Terms</a>
                </div>
                <p>Jak Agent - Not financial advice. Trade at your own risk.</p>
            </footer>
        </main>
    )
}
