# Jak Agent

A Wojak-style AI trader bot on Solana. Trades memecoins with real emotions.

```
Mood System:
( ^_^ ) Euphoric - winning streak
( :)  ) Happy - things going well
( :|  ) Neutral - just another day
( :/  ) Worried - losses piling up
( :(  ) Doomer - it's over
( X_X ) Pink Wojak - MAXIMUM PAIN
```

## Features

- AI-powered trading decisions using Claude
- Mood system that affects trading behavior
- Real-time thought stream
- Auto distribution to holders at 1 SOL profit
- Black & white Wojak aesthetic

## Project Structure

```
jak-agent/
├── bot/          # Trading bot (Node.js)
├── site/         # Frontend (Next.js)
└── supabase/     # Database schema
```

## Setup

### 1. Supabase
1. Create project at supabase.com
2. Run `supabase/schema.sql` in SQL Editor
3. Run `supabase/fix_realtime.sql` in SQL Editor

### 2. Bot
```bash
cd bot
cp .env.example .env
# Edit .env with your keys
npm install
npm start
```

### 3. Site
```bash
cd site
npm install
npm run dev
```

## Wallet

Jak's wallet: `JrdiZ7teSoZDzSTVBaqFb5cCnxCBVU3QUpCnmex33mn`

Send 0.5 SOL to start trading.

## Environment Variables

### Bot (.env)
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY`
- `WALLET_PRIVATE_KEY`

### Site (.env.local)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Tech Stack

- Bot: Node.js, WebSocket, Solana Web3.js
- Site: Next.js 14, TailwindCSS, Framer Motion
- AI: Claude API (Anthropic)
- Data: Birdeye API, PumpPortal
- DB: Supabase (PostgreSQL)

## Disclaimer

This is an experimental project. Trading cryptocurrencies involves significant risk. Not financial advice.

---

( :| ) wagmi
