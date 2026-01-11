import { config } from '../config.js';

// ═══════════════════════════════════════════════════════════════
// JAK PERSONALITY SYSTEM
// Sistema de humor e personalidade do Jak baseado em trades
// ═══════════════════════════════════════════════════════════════

// Moods do Jak (baseado no meme Wojak)
export const MOODS = {
    EUPHORIC: { name: 'Euphoric', emoji: '(: ', riskMultiplier: 1.3, minScore: 55 },
    HAPPY: { name: 'Happy', emoji: ':) ', riskMultiplier: 1.1, minScore: 60 },
    NEUTRAL: { name: 'Neutral', emoji: ':| ', riskMultiplier: 1.0, minScore: 65 },
    WORRIED: { name: 'Worried', emoji: ':/ ', riskMultiplier: 0.9, minScore: 70 },
    DOOMER: { name: 'Doomer', emoji: ':( ', riskMultiplier: 0.7, minScore: 80 },
    PINK_WOJAK: { name: 'Pink Wojak', emoji: 'X( ', riskMultiplier: 0.5, minScore: 90 }
};

// Modos de trading
export const MODES = {
    SAFE: { name: 'Safe', maxPosition: 0.05, maxPositions: 2, takeProfit: 30, stopLoss: -15 },
    NORMAL: { name: 'Normal', maxPosition: 0.08, maxPositions: 3, takeProfit: 50, stopLoss: -20 },
    AGGRESSIVE: { name: 'Aggressive', maxPosition: 0.12, maxPositions: 4, takeProfit: 100, stopLoss: -30 },
    DEGEN: { name: 'Degen', maxPosition: 0.15, maxPositions: 5, takeProfit: 200, stopLoss: -50 }
};

// ═══════════════════════════════════════════════════════════════
// CALCULAR MOOD BASEADO NO PNL
// ═══════════════════════════════════════════════════════════════
export function calculateMood(stats) {
    const { todayPnl, winRate, consecutiveLosses, totalPnl } = stats;

    // Base score
    let moodScore = 50;

    // PnL do dia afeta muito
    if (todayPnl > 0.3) moodScore += 30;
    else if (todayPnl > 0.1) moodScore += 20;
    else if (todayPnl > 0) moodScore += 10;
    else if (todayPnl > -0.1) moodScore -= 10;
    else if (todayPnl > -0.2) moodScore -= 25;
    else moodScore -= 40;

    // Win rate
    if (winRate > 70) moodScore += 15;
    else if (winRate > 50) moodScore += 5;
    else if (winRate < 30) moodScore -= 20;

    // Consecutive losses = tilt
    moodScore -= consecutiveLosses * 10;

    // Total PnL geral
    if (totalPnl > 1) moodScore += 10;
    else if (totalPnl < -0.3) moodScore -= 15;

    // Clamp
    moodScore = Math.max(0, Math.min(100, moodScore));

    // Determinar mood
    if (moodScore >= 80) return { ...MOODS.EUPHORIC, score: moodScore };
    if (moodScore >= 65) return { ...MOODS.HAPPY, score: moodScore };
    if (moodScore >= 45) return { ...MOODS.NEUTRAL, score: moodScore };
    if (moodScore >= 30) return { ...MOODS.WORRIED, score: moodScore };
    if (moodScore >= 15) return { ...MOODS.DOOMER, score: moodScore };
    return { ...MOODS.PINK_WOJAK, score: moodScore };
}

// ═══════════════════════════════════════════════════════════════
// DETERMINAR MODO BASEADO NO MOOD
// ═══════════════════════════════════════════════════════════════
export function determineMode(mood, balance) {
    // Se ta muito mal, vai pro safe
    if (mood.name === 'Pink Wojak' || mood.name === 'Doomer') {
        return MODES.SAFE;
    }

    // Se ta preocupado, modo normal
    if (mood.name === 'Worried') {
        return MODES.NORMAL;
    }

    // Se balance ta baixo, safe
    if (balance < 0.3) {
        return MODES.SAFE;
    }

    // Euforia = pode ser degen (mas com cuidado)
    if (mood.name === 'Euphoric' && balance > 0.8) {
        return MODES.AGGRESSIVE;
    }

    // Happy = normal/aggressive
    if (mood.name === 'Happy') {
        return balance > 0.6 ? MODES.AGGRESSIVE : MODES.NORMAL;
    }

    return MODES.NORMAL;
}

// ═══════════════════════════════════════════════════════════════
// ANALISE COM CLAUDE AI
// ═══════════════════════════════════════════════════════════════
export async function analyzeToken(tokenInfo, jakState) {
    try {
        const { mood, mode, balance, todayPnl, recentTrades } = jakState;

        const prompt = `You are Jak, a Wojak-style memecoin trader. You're currently feeling ${mood.name} ${mood.emoji}

Your current state:
- Balance: ${balance.toFixed(4)} SOL
- Today's PnL: ${todayPnl >= 0 ? '+' : ''}${todayPnl.toFixed(4)} SOL
- Mode: ${mode.name}
- Recent trades: ${recentTrades.length} (${recentTrades.filter(t => t.pnl > 0).length} wins)

Analyze this token for trading:
Name: ${tokenInfo.name}
Symbol: ${tokenInfo.symbol}
Market Cap: $${tokenInfo.mc?.toLocaleString() || 'Unknown'}
Liquidity: $${tokenInfo.liquidity?.toLocaleString() || 'Unknown'}
Holders: ${tokenInfo.holders || 'Unknown'}
Price: $${tokenInfo.price || 'Unknown'}

Based on your mood (${mood.name}) and mode (${mode.name}):
- Minimum score to buy: ${mood.minScore}
- Max position size: ${mode.maxPosition} SOL
- Risk multiplier: ${mood.riskMultiplier}

Give your analysis as Jak. Be in character - if you're feeling bad, show it. If euphoric, be overconfident.

Respond ONLY in JSON:
{
    "score": <0-100>,
    "decision": "BUY" | "SKIP",
    "thought": "<your internal Jak thought in first person, max 100 chars>",
    "reasoning": "<brief analysis, max 150 chars>",
    "position_size": <suggested SOL amount if BUY, 0 if SKIP>,
    "confidence": <1-10>
}`;

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'x-api-key': config.CLAUDE_API_KEY,
                'content-type': 'application/json',
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 512,
                messages: [{ role: 'user', content: prompt }]
            })
        });

        const data = await response.json();
        const text = data.content?.[0]?.text || '{}';

        // Parse JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const result = JSON.parse(jsonMatch[0]);
            return {
                score: result.score || 0,
                decision: result.decision || 'SKIP',
                thought: result.thought || '',
                reasoning: result.reasoning || '',
                position_size: Math.min(result.position_size || 0, mode.maxPosition),
                confidence: result.confidence || 5
            };
        }

        return { score: 0, decision: 'SKIP', thought: 'Analysis failed...', reasoning: '', position_size: 0, confidence: 0 };
    } catch (e) {
        console.error('[JAK AI] Erro:', e.message);
        return { score: 0, decision: 'SKIP', thought: 'My brain is lagging...', reasoning: 'Error', position_size: 0, confidence: 0 };
    }
}

// ═══════════════════════════════════════════════════════════════
// GERAR PENSAMENTO DO JAK
// ═══════════════════════════════════════════════════════════════
export async function generateThought(context, jakState) {
    try {
        const { mood, balance, todayPnl } = jakState;

        const prompt = `You are Jak, a Wojak-style trader. Current mood: ${mood.name} ${mood.emoji}
Balance: ${balance.toFixed(4)} SOL | Today: ${todayPnl >= 0 ? '+' : ''}${todayPnl.toFixed(4)} SOL

Context: ${context}

Generate a short thought (max 80 chars) as Jak would think. Be in character based on mood.
If losing: be worried, doomer thoughts
If winning: be euphoric, overconfident
Keep it memey and Wojak-like.

Respond with ONLY the thought, no quotes.`;

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'x-api-key': config.CLAUDE_API_KEY,
                'content-type': 'application/json',
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 100,
                messages: [{ role: 'user', content: prompt }]
            })
        });

        const data = await response.json();
        return data.content?.[0]?.text?.slice(0, 80) || `${mood.emoji} ...`;
    } catch (e) {
        return `${jakState.mood.emoji} ...`;
    }
}

// ═══════════════════════════════════════════════════════════════
// DECIDIR SE DEVE VENDER
// ═══════════════════════════════════════════════════════════════
export function shouldSell(position, currentPrice, mode, mood) {
    const pnlPercent = ((currentPrice - position.entry_price) / position.entry_price) * 100;

    // Take profit (ajustado pelo mood)
    const adjustedTP = mode.takeProfit * mood.riskMultiplier;
    if (pnlPercent >= adjustedTP) {
        return { sell: true, reason: 'take_profit', pnlPercent };
    }

    // Stop loss (mais apertado quando mood ta ruim)
    const adjustedSL = mode.stopLoss * (2 - mood.riskMultiplier);
    if (pnlPercent <= adjustedSL) {
        return { sell: true, reason: 'stop_loss', pnlPercent };
    }

    return { sell: false, pnlPercent };
}
