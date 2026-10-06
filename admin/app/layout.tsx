import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import { ThemeProvider } from '@/contexts/theme-context';
import { ToastProvider } from '@/contexts/toast-context';
import { AdminAuthProvider } from '@/contexts/auth-context';
import { AdminShell } from '@/components/auth/admin-shell';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'CASA — Administrative Governance & Operations Portal',
  description:
    'Internal moderation queue, listing approvals, taxonomy configuration, user role management, and audit logging for CASA Real Estate.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="antialiased min-h-screen w-full flex flex-col font-sans bg-casa-canvas text-casa-text-primary transition-colors duration-200">
        <ThemeProvider>
          <ToastProvider>
            <AdminAuthProvider>
              <AdminShell>{children}</AdminShell>
            </AdminAuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
