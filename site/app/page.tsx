'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { supabase, JakStatus, JakThought, Position, Trade, getJakStatus, getRecentThoughts, getOpenPositions, getRecentTrades, getTotalDistributed } from '@/lib/supabase'

const MOOD_CONFIG: Record<string, { label: string, class: string }> = {
    'Euphoric': { label: 'Euphoric', class: 'mood-euphoric' },
    'Happy': { label: 'Happy', class: 'mood-happy' },
    'Neutral': { label: 'Neutral', class: 'mood-neutral' },
    'Worried': { label: 'Worried', class: 'mood-worried' },
    'Doomer': { label: 'Doomer', class: 'mood-doomer' },
    'Pink Wojak': { label: 'Distressed', class: 'mood-pinkwojak' }
}

// Parallax Background Component
function ParallaxBackground() {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({
                x: (e.clientX / window.innerWidth - 0.5) * 30,
                y: (e.clientY / window.innerHeight - 0.5) * 30
            })
        }
        window.addEventListener('mousemove', handleMouseMove)
        return () => window.removeEventListener('mousemove', handleMouseMove)
    }, [])

    return (
        <div className="parallax-container">
            <div className="grid-pattern" />
            <motion.div
                className="parallax-layer"
                animate={{
                    x: mousePosition.x * 0.5,
                    y: mousePosition.y * 0.5
                }}
                transition={{ type: 'spring', stiffness: 50, damping: 30 }}
            >
                <div className="geo-shape geo-shape-1" />
                <div className="geo-shape geo-shape-2" />
            </motion.div>
            <motion.div
                className="parallax-layer"
                animate={{
                    x: mousePosition.x * 1,
                    y: mousePosition.y * 1
                }}
                transition={{ type: 'spring', stiffness: 50, damping: 30 }}
            >
                <div className="geo-shape geo-shape-3" />
                <div className="geo-shape geo-shape-4" />
            </motion.div>
            {/* Floating particles */}
            {[...Array(20)].map((_, i) => (
                <motion.div
                    key={i}
                    className="particle"
                    style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 15}s`
                    }}
                    animate={{
                        x: mousePosition.x * (0.2 + Math.random() * 0.3),
                        y: mousePosition.y * (0.2 + Math.random() * 0.3)
                    }}
                    transition={{ type: 'spring', stiffness: 30, damping: 20 }}
                />
            ))}
        </div>
    )
}

export default function Home() {
    const [jakStatus, setJakStatus] = useState<JakStatus | null>(null)
    const [thoughts, setThoughts] = useState<JakThought[]>([])
    const [positions, setPositions] = useState<Position[]>([])
    const [trades, setTrades] = useState<Trade[]>([])
    const [distributed, setDistributed] = useState(0)
    const [loading, setLoading] = useState(true)

    const containerRef = useRef(null)
    const { scrollYProgress } = useScroll({ target: containerRef })
    const headerY = useTransform(scrollYProgress, [0, 0.2], [0, -50])
    const headerOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0.8])

    useEffect(() => {
        loadData()

        const statusChannel = supabase
            .channel('jak_status_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'jak_status' }, () => loadJakStatus())
            .subscribe()

        const thoughtsChannel = supabase
            .channel('thoughts_changes')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'jak_thoughts' }, (payload) => {
                setThoughts(prev => [payload.new as JakThought, ...prev.slice(0, 19)])
            })
            .subscribe()

        const positionsChannel = supabase
            .channel('positions_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'positions' }, () => loadPositions())
            .subscribe()

        const tradesChannel = supabase
            .channel('trades_changes')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'trades' }, () => loadTrades())
            .subscribe()

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
        await Promise.all([loadJakStatus(), loadThoughts(), loadPositions(), loadTrades(), loadDistributed()])
        setLoading(false)
    }

    async function loadJakStatus() { setJakStatus(await getJakStatus()) }
    async function loadThoughts() { setThoughts(await getRecentThoughts(20)) }
    async function loadPositions() { setPositions(await getOpenPositions()) }
    async function loadTrades() { setTrades(await getRecentTrades(20)) }
    async function loadDistributed() { setDistributed(await getTotalDistributed()) }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <ParallaxBackground />
                <motion.div
                    className="main-content text-center"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full border-4 border-gray-200 border-t-indigo-500 animate-spin" />
                    <p className="text-gray-500 text-lg">Loading Jak Agent...</p>
                </motion.div>
            </div>
        )
    }

    const mood = jakStatus?.mood || 'Neutral'
    const moodConfig = MOOD_CONFIG[mood] || MOOD_CONFIG['Neutral']

    return (
        <div ref={containerRef} className="min-h-screen">
            <ParallaxBackground />

            <main className="main-content max-w-7xl mx-auto px-4 py-8">
                {/* Header */}
                <motion.header
                    className="text-center mb-12"
                    style={{ y: headerY, opacity: headerOpacity }}
                >
                    <motion.div
                        initial={{ opacity: 0, y: -30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        {/* Avatar */}
                        <motion.div
                            className="avatar w-28 h-28 mx-auto mb-6"
                            whileHover={{ scale: 1.05, rotate: 5 }}
                            transition={{ type: 'spring', stiffness: 300 }}
                        >
                            <img
                                src="https://media.discordapp.net/attachments/1417635370065072252/1459765948071547106/image.png?ex=6964787b&is=696326fb&hm=55375acccfdda59a161f9a9bfe03850112b0e34fea32b54a8cceb774a21bec11&=&format=webp&quality=lossless&width=1008&height=1008"
                                alt="Jak Agent"
                            />
                        </motion.div>

                        <h1 className="text-4xl md:text-5xl font-bold mb-2">
                            <span className="gradient-text">Jak Agent</span>
                        </h1>
                        <p className="text-gray-500 text-lg mb-4">AI-Powered Memecoin Trader</p>

                        {/* Status Badge */}
                        <div className={`status-badge ${jakStatus?.status === 'TRADING' ? 'status-online' : 'status-offline'} mx-auto`}>
                            <span className="status-dot" />
                            {jakStatus?.status === 'TRADING' ? 'Live Trading' : 'Offline'}
                        </div>
                    </motion.div>
                </motion.header>

                {/* Stats Bar */}
                <motion.div
                    className="card glass mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="card-body">
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div className="stat-box">
                                <div className="stat-value mono">{(jakStatus?.balance_sol || 0).toFixed(4)}</div>
                                <div className="stat-label">Balance (SOL)</div>
                            </div>
                            <div className="stat-box">
                                <div className={`stat-value mono ${(jakStatus?.today_pnl || 0) >= 0 ? 'pnl-positive' : 'pnl-negative'}`}>
                                    {(jakStatus?.today_pnl || 0) >= 0 ? '+' : ''}{(jakStatus?.today_pnl || 0).toFixed(4)}
                                </div>
                                <div className="stat-label">Today PnL</div>
                            </div>
                            <div className="stat-box">
                                <div className={`stat-value mono ${(jakStatus?.total_pnl || 0) >= 0 ? 'pnl-positive' : 'pnl-negative'}`}>
                                    {(jakStatus?.total_pnl || 0) >= 0 ? '+' : ''}{(jakStatus?.total_pnl || 0).toFixed(4)}
                                </div>
                                <div className="stat-label">Total PnL</div>
                            </div>
                            <div className="stat-box">
                                <div className="stat-value">{(jakStatus?.win_rate || 0).toFixed(0)}%</div>
                                <div className="stat-label">Win Rate</div>
                            </div>
                            <div className="stat-box">
                                <div className="stat-value pnl-positive">{distributed.toFixed(2)}</div>
                                <div className="stat-label">Distributed</div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Column */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Mood & Status */}
                        <motion.div
                            className="card hover-lift"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <div className="card-header">Current State</div>
                            <div className="card-body">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-gray-500">Mood</span>
                                    <span className={`mood-indicator ${moodConfig.class}`}>
                                        {moodConfig.label}
                                    </span>
                                </div>
                                <div className="mb-4">
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-gray-500">Mood Score</span>
                                        <span className="font-medium">{jakStatus?.mood_score || 50}/100</span>
                                    </div>
                                    <div className="progress-bar">
                                        <div
                                            className="progress-fill"
                                            style={{
                                                width: `${jakStatus?.mood_score || 50}%`,
                                                background: `linear-gradient(90deg, #ef4444, #f59e0b, #10b981)`,
                                                backgroundSize: '200% 100%',
                                                backgroundPosition: `${100 - (jakStatus?.mood_score || 50)}% 0`
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-gray-500">Mode</span>
                                    <span className="font-semibold">{jakStatus?.mode || 'Normal'}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-500">Trades Today</span>
                                    <span className="font-semibold">
                                        {jakStatus?.wins || 0}W / {jakStatus?.losses || 0}L
                                    </span>
                                </div>
                            </div>
                        </motion.div>

                        {/* Thought Bubble */}
                        <motion.div
                            className="card hover-lift"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <div className="card-header">Latest Thought</div>
                            <div className="card-body">
                                <motion.div
                                    className="thought-bubble"
                                    key={jakStatus?.last_thought}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                >
                                    "{jakStatus?.last_thought || 'Analyzing markets...'}"
                                </motion.div>
                            </div>
                        </motion.div>

                        {/* Wallet */}
                        <motion.div
                            className="card hover-lift"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 }}
                        >
                            <div className="card-header">Wallet</div>
                            <div className="card-body">
                                <div className="wallet-address">
                                    {jakStatus?.wallet_address || 'Loading...'}
                                </div>
                                <p className="text-xs text-gray-400 mt-3 text-center">
                                    Send SOL to fund trading
                                </p>
                            </div>
                        </motion.div>
                    </div>

                    {/* Middle Column - Thoughts Feed */}
                    <div className="lg:col-span-4">
                        <motion.div
                            className="card h-full"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <div className="card-header">Thought Stream</div>
                            <div className="card-body h-[600px] overflow-y-auto">
                                <AnimatePresence>
                                    {thoughts.map((thought, index) => (
                                        <motion.div
                                            key={thought.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            transition={{ delay: index * 0.03 }}
                                            className="trade-item"
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`trade-type ${
                                                        thought.type === 'buy' ? 'trade-buy' :
                                                        thought.type === 'sell' ? 'trade-sell' : ''
                                                    }`}>
                                                        {thought.type === 'buy' ? 'B' :
                                                         thought.type === 'sell' ? 'S' : 'T'}
                                                    </span>
                                                    {thought.token_symbol && (
                                                        <span className="font-semibold text-sm">${thought.token_symbol}</span>
                                                    )}
                                                    <span className="text-xs text-gray-400 ml-auto">
                                                        {new Date(thought.created_at).toLocaleTimeString()}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600 italic">"{thought.thought}"</p>
                                                {thought.pnl !== undefined && thought.pnl !== null && (
                                                    <p className={`text-sm font-semibold mt-1 ${thought.pnl >= 0 ? 'pnl-positive' : 'pnl-negative'}`}>
                                                        {thought.pnl >= 0 ? '+' : ''}{thought.pnl.toFixed(4)} SOL
                                                    </p>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                {thoughts.length === 0 && (
                                    <div className="text-center text-gray-400 py-12">
                                        <p>Waiting for thoughts...</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>

                    {/* Right Column */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Open Positions */}
                        <motion.div
                            className="card hover-lift"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <div className="card-header">Open Positions</div>
                            <div className="card-body max-h-[250px] overflow-y-auto">
                                {positions.map(position => (
                                    <motion.div
                                        key={position.id}
                                        className="trade-item"
                                        whileHover={{ scale: 1.01 }}
                                    >
                                        <div>
                                            <div className="font-semibold">
                                                ${position.tokens?.symbol || position.token_ca.slice(0, 8)}
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                {position.amount_sol.toFixed(4)} SOL
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`font-semibold ${position.pnl_percent >= 0 ? 'pnl-positive' : 'pnl-negative'}`}>
                                                {position.pnl_percent >= 0 ? '+' : ''}{position.pnl_percent?.toFixed(1) || 0}%
                                            </div>
                                            <div className={`text-xs ${(position.pnl_sol || 0) >= 0 ? 'pnl-positive' : 'pnl-negative'}`}>
                                                {(position.pnl_sol || 0) >= 0 ? '+' : ''}{(position.pnl_sol || 0).toFixed(4)}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                                {positions.length === 0 && (
                                    <div className="text-center text-gray-400 py-6">
                                        No open positions
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        {/* Trade History */}
                        <motion.div
                            className="card hover-lift"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <div className="card-header">Recent Trades</div>
                            <div className="card-body max-h-[300px] overflow-y-auto">
                                {trades.map((trade, index) => (
                                    <motion.div
                                        key={trade.id}
                                        className="trade-item"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: index * 0.02 }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className={`trade-type ${trade.type === 'buy' ? 'trade-buy' : 'trade-sell'}`}>
                                                {trade.type === 'buy' ? 'B' : 'S'}
                                            </span>
                                            <span className="font-medium">
                                                ${trade.tokens?.symbol || trade.token_ca.slice(0, 6)}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm">{trade.amount_sol.toFixed(4)} SOL</div>
                                            {trade.pnl_sol !== null && trade.pnl_sol !== undefined && (
                                                <div className={`text-xs font-medium ${trade.pnl_sol >= 0 ? 'pnl-positive' : 'pnl-negative'}`}>
                                                    {trade.pnl_sol >= 0 ? '+' : ''}{trade.pnl_sol.toFixed(4)}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                                {trades.length === 0 && (
                                    <div className="text-center text-gray-400 py-6">
                                        No trades yet
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Footer */}
                <footer className="text-center mt-16 pb-8">
                    <div className="flex items-center justify-center gap-6 mb-4">
                        <a href="/privacy" className="footer-link">Privacy</a>
                        <span className="text-gray-300">|</span>
                        <a href="/terms" className="footer-link">Terms</a>
                    </div>
                    <p className="text-sm text-gray-400">
                        Not financial advice. Trade at your own risk.
                    </p>
                </footer>
            </main>
        </div>
    )
}
