import type { Metadata } from 'next';
import { Inter, Instrument_Serif } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const serif = Instrument_Serif({
  weight: '400',
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
});

export const metadata: Metadata = {
  title: 'QuietBooks',
  description: 'A calm place for your personal finances',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${serif.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
