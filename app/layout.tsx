import type { Metadata } from 'next';
import { Orbitron, Inter } from 'next/font/google';
import Sidebar from '@/components/Sidebar'; // 👈 यहाँ साइडबार को इम्पोर्ट किया है
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
        // 👈 यहाँ flex और h-screen लगाया है ताकि लेआउट दो हिस्सों में बंट जाए
        className="antialiased flex h-screen overflow-hidden" 
        style={{ backgroundColor: 'var(--cyber-dark)', fontFamily: 'var(--font-inter), sans-serif' }}
      >
        
        {/* 1. बाईं तरफ (Left): तुम्हारा नया ChatGPT स्टाइल साइडबार */}
        <Sidebar />

        {/* 2. दाईं तरफ (Right): मेन डिबेट एरिया (यहाँ स्क्रॉल होगा) */}
        <main className="flex-1 h-screen overflow-y-auto relative">
          {children}
        </main>

      </body>
    </html>
  );
}