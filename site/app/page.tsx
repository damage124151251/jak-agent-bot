'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { supabase, JakStatus, JakThought, Position, Trade, getJakStatus, getRecentThoughts, getOpenPositions, getRecentTrades, getTotalDistributed } from '@/lib/supabase'

// Mood ASCII faces
const MOOD_FACES: Record<string, { face: string, color: string, animation: string }> = {
    'Euphoric': { face: '( ^_^ )', color: '#00ff00', animation: 'float' },
    'Happy': { face: '( :) )', color: '#90EE90', animation: 'float' },
    'Neutral': { face: '( :| )', color: '#ffff00', animation: '' },
    'Worried': { face: '( :/ )', color: '#ffa500', animation: 'shake' },
    'Doomer': { face: '( :( )', color: '#ff6666', animation: 'shake' },
    'Pink Wojak': { face: '( X_X )', color: '#ff0066', animation: 'shake' }
}

// Window component
function Win98Window({ title, children, className = '', icon = '📁' }: { title: string, children: React.ReactNode, className?: string, icon?: string }) {
    return (
        <motion.div
            className={`win98-window ${className}`}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
            <div className="win98-title">
                <span>{icon} {title}</span>
                <div className="win98-title-buttons">
                    <div className="win98-btn">_</div>
                    <div className="win98-btn">□</div>
                    <div className="win98-btn">X</div>
                </div>
            </div>
            <div className="win98-content">
                {children}
            </div>
        </motion.div>
    )
}

export default function Home() {
    const [jakStatus, setJakStatus] = useState<JakStatus | null>(null)
    const [thoughts, setThoughts] = useState<JakThought[]>([])
    const [positions, setPositions] = useState<Position[]>([])
    const [trades, setTrades] = useState<Trade[]>([])
    const [distributed, setDistributed] = useState(0)
    const [loading, setLoading] = useState(true)
    const [currentTime, setCurrentTime] = useState('')

    useEffect(() => {
        loadData()

        // Update time
        const updateTime = () => {
            setCurrentTime(new Date().toLocaleTimeString())
        }
        updateTime()
        const timeInterval = setInterval(updateTime, 1000)

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

        const interval = setInterval(loadData, 30000)

        return () => {
            statusChannel.unsubscribe()
            thoughtsChannel.unsubscribe()
            positionsChannel.unsubscribe()
            tradesChannel.unsubscribe()
            clearInterval(interval)
            clearInterval(timeInterval)
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

    async function loadJakStatus() { const status = await getJakStatus(); setJakStatus(status) }
    async function loadThoughts() { const data = await getRecentThoughts(20); setThoughts(data) }
    async function loadPositions() { const data = await getOpenPositions(); setPositions(data) }
    async function loadTrades() { const data = await getRecentTrades(20); setTrades(data) }
    async function loadDistributed() { const total = await getTotalDistributed(); setDistributed(total) }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center crt">
                <Win98Window title="Loading..." icon="⏳">
                    <div className="text-center p-8">
                        <div className="text-4xl mb-4 spin inline-block">@</div>
                        <p className="text-xl">Loading Jak Agent...</p>
                        <div className="mt-4">
                            <span className="blink">█</span>
                        </div>
                    </div>
                </Win98Window>
            </div>
        )
    }

    const mood = jakStatus?.mood || 'Neutral'
    const moodData = MOOD_FACES[mood] || MOOD_FACES['Neutral']

    return (
        <main className="min-h-screen p-4 crt">
            {/* Marquee Header */}
            <div className="marquee-container mb-4">
                <div className="marquee-text">
                    ★★★ JAK AGENT - WOJAK TRADER BOT ★★★ TRADING LIVE ON SOLANA ★★★
                    BALANCE: {(jakStatus?.balance_sol || 0).toFixed(4)} SOL ★★★
                    TODAY PNL: {(jakStatus?.today_pnl || 0) >= 0 ? '+' : ''}{(jakStatus?.today_pnl || 0).toFixed(4)} SOL ★★★
                    MOOD: {mood} ★★★ NOT FINANCIAL ADVICE ★★★
                </div>
            </div>

            {/* Header */}
            <div className="text-center mb-6">
                <motion.h1
                    className="text-4xl md:text-6xl font-bold pixel-text rainbow mb-2"
                    initial={{ y: -100 }}
                    animate={{ y: 0 }}
                    transition={{ type: 'spring', bounce: 0.5 }}
                >
                    JAK AGENT
                </motion.h1>
                <p className="text-xl glitch" data-text="~ wojak trader bot ~">~ wojak trader bot ~</p>
                <div className="construction inline-block px-4 py-1 mt-2">
                    <span className="text-black font-bold blink">🚧 LIVE TRADING 🚧</span>
                </div>
            </div>

            {/* Main Grid */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-4">

                {/* Left Column - Jak Status */}
                <div className="lg:col-span-4 space-y-4">

                    {/* Jak Avatar Window */}
                    <Win98Window title="jak.exe" icon="👤">
                        <div className="text-center">
                            {/* Avatar */}
                            <motion.div
                                className={`relative inline-block ${moodData.animation}`}
                                whileHover={{ scale: 1.1 }}
                            >
                                <div className="w-32 h-32 mx-auto mb-4 win98-inset p-2">
                                    <img
                                        src="https://media.discordapp.net/attachments/1417635370065072252/1459765948071547106/image.png?ex=6964787b&is=696326fb&hm=55375acccfdda59a161f9a9bfe03850112b0e34fea32b54a8cceb774a21bec11&=&format=webp&quality=lossless&width=1008&height=1008"
                                        alt="Jak"
                                        className="w-full h-full object-cover"
                                        style={{ imageRendering: 'pixelated' }}
                                    />
                                </div>
                            </motion.div>

                            {/* Mood Face */}
                            <motion.div
                                className="text-4xl font-mono mb-2"
                                style={{ color: moodData.color }}
                                animate={{
                                    scale: [1, 1.1, 1],
                                    rotate: mood === 'Pink Wojak' ? [0, -5, 5, 0] : 0
                                }}
                                transition={{ repeat: Infinity, duration: 2 }}
                            >
                                {moodData.face}
                            </motion.div>

                            <div className="text-2xl font-bold" style={{ color: moodData.color }}>
                                {mood.toUpperCase()}
                            </div>

                            {/* Mood Bar */}
                            <div className="mt-2 win98-inset p-1">
                                <div
                                    className="h-4 transition-all duration-500"
                                    style={{
                                        width: `${jakStatus?.mood_score || 50}%`,
                                        background: `linear-gradient(90deg, #ff0000, #ffff00, #00ff00)`,
                                        backgroundSize: '200% 100%',
                                        backgroundPosition: `${100 - (jakStatus?.mood_score || 50)}% 0`
                                    }}
                                />
                            </div>
                            <div className="text-sm mt-1">Mood Score: {jakStatus?.mood_score || 50}/100</div>
                        </div>
                    </Win98Window>

                    {/* Thought Bubble */}
                    <Win98Window title="jak_brain.txt" icon="💭">
                        <motion.div
                            className="thought-bubble"
                            key={jakStatus?.last_thought}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                        >
                            <p className="text-lg italic text-black">"{jakStatus?.last_thought || '...'}"</p>
                        </motion.div>
                    </Win98Window>

                    {/* Stats */}
                    <Win98Window title="stats.exe" icon="📊">
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between win98-inset p-1">
                                <span>Status:</span>
                                <span className={jakStatus?.status === 'TRADING' ? 'status-online blink' : 'status-offline'}>
                                    ● {jakStatus?.status || 'OFFLINE'}
                                </span>
                            </div>
                            <div className="flex justify-between win98-inset p-1">
                                <span>Mode:</span>
                                <span className="font-bold">{jakStatus?.mode || 'Normal'}</span>
                            </div>
                            <div className="flex justify-between win98-inset p-1">
                                <span>Balance:</span>
                                <span className="font-bold fire-text">{(jakStatus?.balance_sol || 0).toFixed(4)} SOL</span>
                            </div>
                            <div className="flex justify-between win98-inset p-1">
                                <span>Today PnL:</span>
                                <motion.span
                                    className={`font-bold ${(jakStatus?.today_pnl || 0) >= 0 ? 'pnl-positive' : 'pnl-negative'}`}
                                    animate={{ scale: [1, 1.1, 1] }}
                                    transition={{ repeat: Infinity, duration: 1 }}
                                >
                                    {(jakStatus?.today_pnl || 0) >= 0 ? '+' : ''}{(jakStatus?.today_pnl || 0).toFixed(4)} SOL
                                </motion.span>
                            </div>
                            <div className="flex justify-between win98-inset p-1">
                                <span>Total PnL:</span>
                                <span className={`font-bold ${(jakStatus?.total_pnl || 0) >= 0 ? 'pnl-positive' : 'pnl-negative'}`}>
                                    {(jakStatus?.total_pnl || 0) >= 0 ? '+' : ''}{(jakStatus?.total_pnl || 0).toFixed(4)} SOL
                                </span>
                            </div>
                            <div className="flex justify-between win98-inset p-1">
                                <span>Daily Goal:</span>
                                <span>{(jakStatus?.daily_goal || 0.2).toFixed(2)} SOL</span>
                            </div>
                            <div className="flex justify-between win98-inset p-1 bg-yellow-200">
                                <span>💰 Distributed:</span>
                                <span className="font-bold">{distributed.toFixed(2)} SOL</span>
                            </div>
                        </div>
                    </Win98Window>

                    {/* Win Rate */}
                    <Win98Window title="performance.dll" icon="🏆">
                        <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="win98-inset p-2">
                                <div className="text-2xl font-bold">{jakStatus?.total_trades || 0}</div>
                                <div className="text-xs">TRADES</div>
                            </div>
                            <div className="win98-inset p-2">
                                <div className="text-2xl font-bold pnl-positive">{jakStatus?.wins || 0}</div>
                                <div className="text-xs">WINS</div>
                            </div>
                            <div className="win98-inset p-2">
                                <div className="text-2xl font-bold pnl-negative">{jakStatus?.losses || 0}</div>
                                <div className="text-xs">LOSSES</div>
                            </div>
                        </div>
                        <div className="mt-2 text-center win98-button w-full">
                            <span className="text-xl font-bold rainbow">
                                {(jakStatus?.win_rate || 0).toFixed(1)}% WIN RATE
                            </span>
                        </div>
                    </Win98Window>
                </div>

                {/* Middle Column - Thoughts Feed */}
                <div className="lg:col-span-4">
                    <Win98Window title="C:\JAK\BRAIN\thoughts.log" icon="🧠" className="h-full">
                        <div className="win98-inset p-2 h-[600px] overflow-y-auto">
                            <AnimatePresence>
                                {thoughts.map((thought, index) => (
                                    <motion.div
                                        key={thought.id}
                                        initial={{ opacity: 0, x: -50, rotateX: 90 }}
                                        animate={{ opacity: 1, x: 0, rotateX: 0 }}
                                        exit={{ opacity: 0, x: 50 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="mb-2 p-2 bg-white border-2 border-black"
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className={`text-xs px-2 py-0.5 ${
                                                thought.type === 'buy' ? 'bg-green-500 text-white' :
                                                thought.type === 'sell' ? 'bg-red-500 text-white' :
                                                'bg-gray-300'
                                            }`}>
                                                {thought.type.toUpperCase()}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {new Date(thought.created_at).toLocaleTimeString()}
                                            </span>
                                        </div>
                                        {thought.token_symbol && (
                                            <div className="text-sm font-bold text-blue-600">
                                                ${thought.token_symbol}
                                            </div>
                                        )}
                                        <p className="text-sm text-black italic">"{thought.thought}"</p>
                                        {thought.score !== undefined && (
                                            <div className="mt-1 text-xs">
                                                Score: <span className="font-bold">{thought.score}</span> | {thought.decision}
                                            </div>
                                        )}
                                        {thought.pnl !== undefined && thought.pnl !== null && (
                                            <motion.div
                                                className={`mt-1 text-sm font-bold ${thought.pnl >= 0 ? 'pnl-positive' : 'pnl-negative'}`}
                                                animate={{ scale: [1, 1.2, 1] }}
                                            >
                                                {thought.pnl >= 0 ? '📈' : '📉'} {thought.pnl >= 0 ? '+' : ''}{thought.pnl.toFixed(4)} SOL
                                            </motion.div>
                                        )}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            {thoughts.length === 0 && (
                                <div className="text-center text-gray-500 py-8">
                                    <p>Jak is thinking...</p>
                                    <span className="blink text-2xl">█</span>
                                </div>
                            )}
                        </div>
                    </Win98Window>
                </div>

                {/* Right Column - Positions & Trades */}
                <div className="lg:col-span-4 space-y-4">

                    {/* Open Positions */}
                    <Win98Window title="positions.exe" icon="📂">
                        <div className="space-y-2 max-h-[250px] overflow-y-auto">
                            {positions.map(position => (
                                <motion.div
                                    key={position.id}
                                    className="win98-inset p-2"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    whileHover={{ scale: 1.02 }}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="font-bold text-blue-600">
                                                ${position.tokens?.symbol || position.token_ca.slice(0, 8)}
                                            </div>
                                            <div className="text-xs">
                                                {position.amount_sol.toFixed(4)} SOL
                                            </div>
                                        </div>
                                        <motion.div
                                            className={`text-right font-bold ${position.pnl_percent >= 0 ? 'pnl-positive' : 'pnl-negative'}`}
                                            animate={{
                                                scale: position.pnl_percent > 50 || position.pnl_percent < -20 ? [1, 1.1, 1] : 1
                                            }}
                                            transition={{ repeat: Infinity, duration: 0.5 }}
                                        >
                                            <div>
                                                {position.pnl_percent >= 0 ? '+' : ''}{position.pnl_percent?.toFixed(1) || 0}%
                                            </div>
                                            <div className="text-xs">
                                                {(position.pnl_sol || 0) >= 0 ? '+' : ''}{(position.pnl_sol || 0).toFixed(4)} SOL
                                            </div>
                                        </motion.div>
                                    </div>
                                </motion.div>
                            ))}
                            {positions.length === 0 && (
                                <div className="text-center text-gray-500 py-4">
                                    No open positions
                                </div>
                            )}
                        </div>
                    </Win98Window>

                    {/* Recent Trades */}
                    <Win98Window title="trade_history.log" icon="📜">
                        <div className="space-y-1 max-h-[300px] overflow-y-auto win98-inset p-1">
                            {trades.map((trade, index) => (
                                <motion.div
                                    key={trade.id}
                                    className="p-1 bg-white border border-gray-400 text-sm flex justify-between items-center"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.02 }}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className={`px-1 text-xs font-bold ${
                                            trade.type === 'buy' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                                        }`}>
                                            {trade.type === 'buy' ? '▲' : '▼'}
                                        </span>
                                        <span className="font-bold">${trade.tokens?.symbol || trade.token_ca.slice(0, 6)}</span>
                                    </div>
                                    <div className="text-right">
                                        <div>{trade.amount_sol.toFixed(4)} SOL</div>
                                        {trade.pnl_sol !== null && trade.pnl_sol !== undefined && (
                                            <div className={`text-xs font-bold ${trade.pnl_sol >= 0 ? 'pnl-positive' : 'pnl-negative'}`}>
                                                {trade.pnl_sol >= 0 ? '+' : ''}{trade.pnl_sol.toFixed(4)}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                            {trades.length === 0 && (
                                <div className="text-center text-gray-500 py-4">
                                    No trades yet
                                </div>
                            )}
                        </div>
                    </Win98Window>

                    {/* Wallet */}
                    <Win98Window title="wallet.dat" icon="💼">
                        <div className="win98-inset p-2">
                            <div className="text-xs text-gray-600 mb-1">Jak's Wallet Address:</div>
                            <div className="font-mono text-xs break-all bg-black text-green-400 p-2">
                                {jakStatus?.wallet_address || 'Loading...'}
                            </div>
                            <div className="text-xs text-center mt-2 text-gray-500">
                                Send SOL to fuel Jak's trading
                            </div>
                        </div>
                    </Win98Window>
                </div>
            </div>

            {/* Taskbar */}
            <div className="fixed bottom-0 left-0 right-0 win98-window">
                <div className="flex items-center justify-between px-2 py-1 striped-bg">
                    <div className="flex items-center gap-2">
                        <button className="win98-button text-sm flex items-center gap-1">
                            <span>🪟</span> Start
                        </button>
                        <div className="win98-inset px-2 py-0.5 text-sm">
                            📊 jak_agent.exe
                        </div>
                    </div>
                    <div className="win98-inset px-2 py-0.5 text-sm">
                        {currentTime}
                    </div>
                </div>
            </div>

            {/* Footer spacer for taskbar */}
            <div className="h-16"></div>

            {/* Footer Links */}
            <div className="text-center py-4 text-sm">
                <a href="/privacy" className="win98-button mx-1 text-xs">Privacy</a>
                <a href="/terms" className="win98-button mx-1 text-xs">Terms</a>
                <p className="mt-2 text-white text-xs">
                    ⚠️ Not financial advice. Trade at your own risk. ⚠️
                </p>
                <p className="text-white text-xs mt-1">
                    Best viewed in Netscape Navigator 4.0
                </p>
            </div>
        </main>
    )
}
