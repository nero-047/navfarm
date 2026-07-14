import './global.css';
import { AuthProvider } from '@/contexts/AuthContext';

export const metadata = {
  title: 'NAVFarm',
  description: 'Universal Farm Management Software for Agriculture',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
