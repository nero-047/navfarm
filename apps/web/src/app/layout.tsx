import './global.css';

export const metadata = {
  title: 'NAVFarm',
  description: 'NAVFarm agriculture operations platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
