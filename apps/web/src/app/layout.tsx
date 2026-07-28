import './global.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/hooks/useTheme';
import { LanguageProvider } from '@/hooks/useLanguage';

export const metadata = {
  title: 'NAVFarm',
  description: 'Universal Farm Management Software for Agriculture',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>{children}</AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
