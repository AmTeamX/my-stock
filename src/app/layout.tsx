export const metadata = {
  title: "MyStock - จัดการ Stock พยาบาล",
  description: "ระบบจัดการ Stock ผ่าน LINE สำหรับพยาบาล",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <head>
        <meta name="format-detection" content="telephone=no" />
        <meta name="theme-color" content="#06C755" />
      </head>
      <body>
        <main className="min-h-screen max-w-md mx-auto bg-[#F5F5F5] relative">
          {children}
        </main>
      </body>
    </html>
  );
}
