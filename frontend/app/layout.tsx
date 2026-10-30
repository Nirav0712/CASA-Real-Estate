import type { Metadata } from 'next';
import Script from 'next/script';
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
import { PlanSelectionModal } from '@/components/pricing/plan-selection-modal';
import { TrialExpiredModal } from '@/components/pricing/trial-expired-modal';
import { LoginProtectionModal } from '@/components/auth/login-protection-modal';
import { PostLoginModal } from '@/components/auth/post-login-modal';

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

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://casa-real-estate-mocha.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'MyProperty — Real Estate Marketplace | Verified Properties, Plots & Commercial',
    template: '%s | MyProperty',
  },
  description:
    'Discover, buy, and lease residential houses, luxury flats, plotting land, and commercial properties across top regional cities on MyProperty Marketplace.',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: 'MyProperty Marketplace',
    title: 'MyProperty — Real Estate Marketplace',
    description: 'Verified real estate properties, plots, and commercial listings across India on MyProperty.',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'MyProperty Real Estate' }],
  },
  robots: {
    index: true,
    follow: true,
  },
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
                    <PlanSelectionModal />
                    <TrialExpiredModal />
                    <LoginProtectionModal />
                    <PostLoginModal />
                    <Script
                      src="https://checkout.razorpay.com/v1/checkout.js"
                      strategy="lazyOnload"
                    />
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
