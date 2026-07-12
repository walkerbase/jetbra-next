import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'License Console Demo',
  description: 'Next.js + shadcn/ui + Nano Stores demo',
  icons: {
    icon: 'https://www.jetbrains.com/favicon.ico?r=1234',
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" className="dark">
      <body>{children}</body>
    </html>
  );
}
