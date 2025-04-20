import type { Metadata } from 'next';
// Remove Inter font, use Open Sans defined in globals.css via Tailwind
// import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './_providers';
import { AuthProvider } from '../contexts/AuthContext';

// const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'RAC Graph - Process Compliance and Risk Management',
  description: 'AI-driven Process Compliance and Risk Management Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      {/* Remove inter.className, font-sans is applied globally in globals.css */}
      {/* <body className={inter.className}> */}
      <body>
        <AuthProvider>
          <Providers>{children}</Providers>
        </AuthProvider>
      </body>
    </html>
  );
} 