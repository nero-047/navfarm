import './global.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/hooks/useTheme';
import { LanguageProvider } from '@/hooks/useLanguage';

export const metadata = {
  title: 'NAVFarm',
  description: 'Universal Farm Management Software for Agriculture',
  icons: {
    icon: 'https://nav-cdn.pages.dev/images/favicon.png',
    shortcut: 'https://nav-cdn.pages.dev/images/favicon.png',
    apple: 'https://nav-cdn.pages.dev/images/favicon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/png" href="https://nav-cdn.pages.dev/images/favicon.png" />
        <link rel="apple-touch-icon" href="https://nav-cdn.pages.dev/images/favicon.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var p=localStorage.getItem("navfarm_theme");var t=(p==="light"||p==="dark")?p:(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");document.documentElement.setAttribute("data-theme",t);}catch(e){}})();`,
          }}
        />
      </head>
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
