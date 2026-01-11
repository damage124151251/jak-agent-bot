import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Jak Agent | Wojak Trader Bot',
  description: 'A Wojak-style AI trader bot on Solana. Watch Jak trade memecoins with emotions.',
  keywords: ['solana', 'memecoin', 'trading', 'bot', 'ai', 'wojak', 'pumpfun'],
  openGraph: {
    title: 'Jak Agent | Wojak Trader Bot',
    description: 'A Wojak-style AI trader bot on Solana',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Jak Agent | Wojak Trader Bot',
    description: 'A Wojak-style AI trader bot on Solana',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="scanlines">
        {children}
      </body>
    </html>
  )
}
