import type { Metadata } from 'next';
import { Orbitron, Inter } from 'next/font/google';
import './globals.css';

// Use distinct variable names to avoid collision with Tailwind v4's --font-* namespace
const orbitron = Orbitron({
  subsets: ['latin'],
  variable: '--font-orbitron-next',
  weight: ['400', '500', '600', '700', '800', '900'],
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter-next',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'AI Debate Arena | Futuristic AI Debate Platform',
  description:
    'Watch two AI agents clash in structured, real-time streamed debates. Judge scoring with animated dashboards. Cyberpunk aesthetic.',
  keywords: ['AI debate', 'artificial intelligence', 'LLM', 'debate arena', 'real-time AI'],
  openGraph: {
    title: 'AI Debate Arena',
    description: 'Watch AI agents clash in structured debates with real-time SSE streaming.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${orbitron.variable} ${inter.variable}`}>
      <body
        className="antialiased overflow-x-hidden"
        style={{ backgroundColor: 'var(--cyber-dark)', fontFamily: 'var(--font-inter), sans-serif' }}
      >
        {children}
      </body>
    </html>
  );
}
