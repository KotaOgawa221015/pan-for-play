import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="bg-gray-200 flex justify-center">
        {/* スマホサイズのコンテナ */}
        <main className="w-full max-w-md min-h-screen bg-white shadow-xl relative">
          {children}
        </main>
      </body>
    </html>
  );
}
