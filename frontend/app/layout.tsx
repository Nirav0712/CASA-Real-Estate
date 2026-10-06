import type { Metadata } from 'next';
import { Inter, Noto_Sans_Arabic } from 'next/font/google';
import '@/styles/globals.css';
import { Header, Footer } from '@/components/layout/header';
import { ThemeProvider } from '@/contexts/theme-context';
import { LanguageProvider } from '@/contexts/language-context';
import { ToastProvider } from '@/contexts/toast-context';
import { AuthProvider } from '@/contexts/auth-context';
import { SavedPropertiesProvider } from '@/contexts/saved-properties-context';
import { ComparisonProvider } from '@/contexts/comparison-context';
import { AuthModal } from '@/components/auth/auth-modal';
import { ComparisonBar } from '@/components/property/comparison-bar';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const arabic = Noto_Sans_Arabic({
  subsets: ['arabic'],
  variable: '--font-arabic',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'CASA — Real Estate Marketplace | Verified Properties, Plots & Commercial',
  description:
    'Discover, buy, and lease residential houses, luxury flats, plotting land, and commercial properties across top regional cities on CASA.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" dir="ltr" className={`${inter.variable} ${arabic.variable}`} suppressHydrationWarning>
      <body className="antialiased min-h-screen flex flex-col font-sans bg-casa-canvas text-casa-text-primary transition-colors duration-200">
        <ThemeProvider>
          <LanguageProvider>
            <ToastProvider>
              <AuthProvider>
                <SavedPropertiesProvider>
                  <ComparisonProvider>
                    <Header />
                    <main className="flex-1">{children}</main>
                    <Footer />
                    <AuthModal />
                    <ComparisonBar />
                  </ComparisonProvider>
                </SavedPropertiesProvider>
              </AuthProvider>
            </ToastProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
