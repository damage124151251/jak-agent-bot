import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import * as db from './lib/supabase.js';
import * as birdeye from './lib/birdeye.js';
import * as pump from './lib/pumpportal.js';
import { calculateMood, determineMode, analyzeToken, generateThought, shouldSell, MOODS, MODES } from './lib/jak-personality.js';

const app = express();
app.use(cors());
app.use(express.json());

// ═══════════════════════════════════════════════════════════════
// JAK STATE
// ═══════════════════════════════════════════════════════════════
let jakState = {
    mood: MOODS.NEUTRAL,
    mode: MODES.NORMAL,
    balance: 0,
    initialBalance: config.JAK_INITIAL_BALANCE,
    todayPnl: 0,
    totalPnl: 0,
    totalTrades: 0,
    wins: 0,
    losses: 0,
    consecutiveLosses: 0,
    recentTrades: [],
    isTrading: false,
    lastThought: ':| Starting up...',
    dailyGoal: config.JAK_DAILY_GOAL,
    distributionThreshold: config.JAK_DISTRIBUTION_THRESHOLD
};

// ═══════════════════════════════════════════════════════════════
// INITIALIZE
// ═══════════════════════════════════════════════════════════════
async function initialize() {
    console.log('\n========================================');
    console.log('      JAK AGENT - WOJAK TRADER');
    console.log('========================================\n');

    // Load wallet
    pump.loadWallet();
    const wallet = pump.getWallet();
    if (!wallet) {
        console.error('[JAK] Wallet nao configurada! Adicione WALLET_PRIVATE_KEY no .env');
        return;
    }

    // Get balance
    jakState.balance = await pump.getBalance();
    console.log(`[JAK] Balance: ${jakState.balance.toFixed(4)} SOL`);

    // Load state from DB
    const savedState = await db.getJakStatus();
    if (savedState) {
        jakState.totalPnl = parseFloat(savedState.total_pnl || 0);
        jakState.totalTrades = savedState.total_trades || 0;
        jakState.wins = savedState.wins || 0;
        jakState.losses = savedState.losses || 0;
    }

    // Calculate initial mood
    updateMoodAndMode();

    // Save initial state
    await saveState();

    // Initial thought
    jakState.lastThought = await generateThought('Just woke up, ready to trade', jakState);
    await db.addJakThought({ type: 'startup', thought: jakState.lastThought, mood: jakState.mood.name });

    console.log(`[JAK] Mood: ${jakState.mood.name} ${jakState.mood.emoji}`);
    console.log(`[JAK] Mode: ${jakState.mode.name}`);
    console.log(`[JAK] Thought: "${jakState.lastThought}"`);

    // Connect to PumpPortal
    pump.connectPumpPortal({
        onConnect: () => {
            pump.subscribeNewTokens();
            jakState.isTrading = true;
            saveState();
        },
        onDisconnect: () => {
            jakState.isTrading = false;
            saveState();
        },
        onToken: handleNewToken,
        onTrade: handleTrade
    });

    // Position monitor loop
    setInterval(monitorPositions, 30000);

    // Daily reset check
    setInterval(checkDailyReset, 60000);

    console.log('\n[JAK] Iniciado! Aguardando tokens...\n');
}

// ═══════════════════════════════════════════════════════════════
// UPDATE MOOD AND MODE
// ═══════════════════════════════════════════════════════════════
function updateMoodAndMode() {
    const winRate = jakState.totalTrades > 0 ? (jakState.wins / jakState.totalTrades) * 100 : 50;

    jakState.mood = calculateMood({
        todayPnl: jakState.todayPnl,
        winRate,
        consecutiveLosses: jakState.consecutiveLosses,
        totalPnl: jakState.totalPnl
    });

    jakState.mode = determineMode(jakState.mood, jakState.balance);
}

// ═══════════════════════════════════════════════════════════════
// SAVE STATE TO DB
// ═══════════════════════════════════════════════════════════════
async function saveState() {
    const wallet = pump.getWallet();
    await db.updateJakStatus({
        status: jakState.isTrading ? 'TRADING' : 'OFFLINE',
        wallet_address: wallet?.publicKey.toBase58() || null,
        balance_sol: jakState.balance,
        initial_balance: jakState.initialBalance,
        today_pnl: jakState.todayPnl,
        total_pnl: jakState.totalPnl,
        daily_goal: jakState.dailyGoal,
        total_trades: jakState.totalTrades,
        wins: jakState.wins,
        losses: jakState.losses,
        win_rate: jakState.totalTrades > 0 ? (jakState.wins / jakState.totalTrades) * 100 : 0,
        mood: jakState.mood.name,
        mood_score: jakState.mood.score || 50,
        mode: jakState.mode.name,
        last_thought: jakState.lastThought,
        consecutive_losses: jakState.consecutiveLosses
    });
}

// ═══════════════════════════════════════════════════════════════
// HANDLE NEW TOKEN
// ═══════════════════════════════════════════════════════════════
async function handleNewToken(token) {
    try {
        // Check if we can trade
        const openPositions = await db.getOpenPositions();
        if (openPositions.length >= jakState.mode.maxPositions) {
            return; // Too many positions
        }

        if (jakState.balance < 0.05) {
            return; // Not enough balance
        }

        // Wait a bit for token to have some data
        await new Promise(r => setTimeout(r, 3000));

        // Get token info
        const tokenInfo = await birdeye.getTokenInfo(token.mint);
        if (!tokenInfo) return;

        // Quick filters
        if (tokenInfo.mc < 5000 || tokenInfo.mc > 500000) return;
        if (tokenInfo.liquidity < 1000) return;

        // AI Analysis
        console.log(`[JAK] Analisando ${tokenInfo.symbol}...`);
        const analysis = await analyzeToken(tokenInfo, {
            mood: jakState.mood,
            mode: jakState.mode,
            balance: jakState.balance,
            todayPnl: jakState.todayPnl,
            recentTrades: jakState.recentTrades
        });

        // Save thought
        jakState.lastThought = analysis.thought;
        await db.addJakThought({
            type: 'analysis',
            token_ca: token.mint,
            token_symbol: tokenInfo.symbol,
            thought: analysis.thought,
            mood: jakState.mood.name,
            score: analysis.score,
            decision: analysis.decision
        });
        await saveState();

        console.log(`[JAK] ${tokenInfo.symbol}: Score ${analysis.score} | ${analysis.decision}`);
        console.log(`[JAK] Pensamento: "${analysis.thought}"`);

        // Decision
        if (analysis.decision === 'BUY' && analysis.score >= jakState.mood.minScore) {
            const positionSize = Math.min(analysis.position_size, jakState.mode.maxPosition, jakState.balance * 0.3);

            if (positionSize >= 0.01) {
                // Save token
                await db.upsertToken({
                    ca: token.mint,
                    name: tokenInfo.name,
                    symbol: tokenInfo.symbol,
                    logo: tokenInfo.logo,
                    market_cap: tokenInfo.mc,
                    price: tokenInfo.price,
                    liquidity: tokenInfo.liquidity,
                    holders: tokenInfo.holders,
                    jak_score: analysis.score,
                    jak_decision: analysis.decision,
                    jak_reasoning: analysis.reasoning
                });

                // Buy
                console.log(`[JAK] COMPRANDO ${positionSize.toFixed(4)} SOL de ${tokenInfo.symbol}!`);
                const txSig = await pump.buyToken(token.mint, positionSize);

                if (txSig) {
                    // Record trade
                    await db.recordTrade({
                        token_ca: token.mint,
                        type: 'buy',
                        amount_sol: positionSize,
                        price: tokenInfo.price,
                        tx_signature: txSig,
                        mood: jakState.mood.name,
                        jak_score: analysis.score
                    });

                    // Create position
                    await db.createPosition({
                        token_ca: token.mint,
                        status: 'open',
                        amount_sol: positionSize,
                        entry_price: tokenInfo.price,
                        current_price: tokenInfo.price,
                        jak_score: analysis.score
                    });

                    // Subscribe to token trades
                    pump.subscribeToken(token.mint);

                    // Update balance
                    jakState.balance = await pump.getBalance();

                    // Generate buy thought
                    jakState.lastThought = await generateThought(`Just bought ${tokenInfo.symbol} for ${positionSize.toFixed(3)} SOL`, jakState);
                    await db.addJakThought({
                        type: 'buy',
                        token_ca: token.mint,
                        token_symbol: tokenInfo.symbol,
                        thought: jakState.lastThought,
                        mood: jakState.mood.name
                    });
                    await saveState();

                    console.log(`[JAK] "${jakState.lastThought}"`);
                }
            }
        }
    } catch (e) {
        console.error('[JAK] Token error:', e.message);
    }
}

// ═══════════════════════════════════════════════════════════════
// HANDLE TRADE (for subscribed tokens)
// ═══════════════════════════════════════════════════════════════
async function handleTrade(trade) {
    // Update token price if we have position
    const positions = await db.getOpenPositions();
    const position = positions.find(p => p.token_ca === trade.mint);

    if (position && trade.price) {
        await db.updatePosition(position.id, {
            current_price: trade.price,
            pnl_percent: ((trade.price - position.entry_price) / position.entry_price) * 100
        });
    }
}

// ═══════════════════════════════════════════════════════════════
// MONITOR POSITIONS
// ═══════════════════════════════════════════════════════════════
async function monitorPositions() {
    try {
        const positions = await db.getOpenPositions();

        for (const position of positions) {
            // Get current price
            const tokenInfo = await birdeye.getTokenInfo(position.token_ca);
            if (!tokenInfo) continue;

            const currentPrice = tokenInfo.price;
            await db.updatePosition(position.id, { current_price: currentPrice });

            // Check if should sell
            const sellCheck = shouldSell(position, currentPrice, jakState.mode, jakState.mood);

            if (sellCheck.sell) {
                console.log(`[JAK] Vendendo ${position.tokens?.symbol || position.token_ca} - ${sellCheck.reason} (${sellCheck.pnlPercent.toFixed(1)}%)`);

                const txSig = await pump.sellToken(position.token_ca, 100);

                if (txSig) {
                    const pnlSol = (sellCheck.pnlPercent / 100) * position.amount_sol;

                    // Close position
                    await db.closePosition(position.id, pnlSol);

                    // Record trade
                    await db.recordTrade({
                        token_ca: position.token_ca,
                        type: 'sell',
                        amount_sol: position.amount_sol + pnlSol,
                        price: currentPrice,
                        pnl_sol: pnlSol,
                        tx_signature: txSig,
                        mood: jakState.mood.name,
                        reason: sellCheck.reason
                    });

                    // Unsubscribe
                    pump.unsubscribeToken(position.token_ca);

                    // Update stats
                    jakState.totalTrades++;
                    jakState.todayPnl += pnlSol;
                    jakState.totalPnl += pnlSol;

                    if (pnlSol >= 0) {
                        jakState.wins++;
                        jakState.consecutiveLosses = 0;
                    } else {
                        jakState.losses++;
                        jakState.consecutiveLosses++;
                    }

                    jakState.recentTrades.push({ pnl: pnlSol, time: Date.now() });
                    if (jakState.recentTrades.length > 10) jakState.recentTrades.shift();

                    // Update balance
                    jakState.balance = await pump.getBalance();

                    // Update mood
                    updateMoodAndMode();

                    // Generate thought
                    const context = pnlSol >= 0
                        ? `Made ${pnlSol.toFixed(4)} SOL profit on ${position.tokens?.symbol || 'token'}`
                        : `Lost ${Math.abs(pnlSol).toFixed(4)} SOL on ${position.tokens?.symbol || 'token'}`;

                    jakState.lastThought = await generateThought(context, jakState);
                    await db.addJakThought({
                        type: 'sell',
                        token_ca: position.token_ca,
                        token_symbol: position.tokens?.symbol,
                        thought: jakState.lastThought,
                        mood: jakState.mood.name,
                        pnl: pnlSol
                    });

                    await saveState();

                    console.log(`[JAK] ${jakState.mood.emoji} "${jakState.lastThought}"`);
                    console.log(`[JAK] Mood agora: ${jakState.mood.name} | Mode: ${jakState.mode.name}`);

                    // Check distribution threshold
                    if (jakState.totalPnl >= jakState.distributionThreshold) {
                        await distributeToHolders();
                    }
                }
            }
        }
    } catch (e) {
        console.error('[JAK] Monitor error:', e.message);
    }
}

// ═══════════════════════════════════════════════════════════════
// DISTRIBUTE TO HOLDERS
// ═══════════════════════════════════════════════════════════════
async function distributeToHolders() {
    console.log('[JAK] Distribuindo 1 SOL para holders!');

    jakState.lastThought = await generateThought('Time to share the gains with the community!', jakState);
    await db.addJakThought({
        type: 'distribution',
        thought: jakState.lastThought,
        mood: jakState.mood.name
    });

    // Record distribution (actual transfer would need holder list)
    await db.recordDistribution({
        amount_sol: 1.0,
        total_pnl_at_distribution: jakState.totalPnl,
        mood: jakState.mood.name
    });

    // Reset threshold counter
    jakState.totalPnl -= 1.0;
    await saveState();
}

// ═══════════════════════════════════════════════════════════════
// DAILY RESET
// ═══════════════════════════════════════════════════════════════
let lastResetDay = new Date().getDate();

function checkDailyReset() {
    const currentDay = new Date().getDate();
    if (currentDay !== lastResetDay) {
        console.log('[JAK] Novo dia! Resetando PnL diario...');
        jakState.todayPnl = 0;
        lastResetDay = currentDay;
        updateMoodAndMode();
        saveState();
    }
}

// ═══════════════════════════════════════════════════════════════
// API ENDPOINTS
// ═══════════════════════════════════════════════════════════════
app.get('/api/status', async (req, res) => {
    const positions = await db.getOpenPositions();
    res.json({
        ...jakState,
        openPositions: positions.length,
        wallet: pump.getWallet()?.publicKey.toBase58() || null
    });
});

app.get('/api/thoughts', async (req, res) => {
    const thoughts = await db.getRecentThoughts(50);
    res.json(thoughts);
});

app.get('/api/positions', async (req, res) => {
    const positions = await db.getOpenPositions();
    res.json(positions);
});

app.get('/api/trades', async (req, res) => {
    const trades = await db.getTodayTrades();
    res.json(trades);
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', jak: jakState.mood.name });
});

// ═══════════════════════════════════════════════════════════════
// START
// ═══════════════════════════════════════════════════════════════
app.listen(config.PORT, () => {
    console.log(`[SERVER] Rodando na porta ${config.PORT}`);
    initialize();
});
