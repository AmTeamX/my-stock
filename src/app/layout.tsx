import "./globals.css";
import LiffAuthGuard from "./components/LiffAuthGuard";
import WardGuard from "./components/WardGuard";

export const metadata = {
  title: "MyStock — จัดการ Stock พยาบาล",
  description: "ระบบจัดการ Stock ผ่าน LINE สำหรับพยาบาล",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
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
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
      </head>
      <body className="bg-paper">
        <LiffAuthGuard>
          <WardGuard>
            <main className="min-h-screen max-w-md mx-auto bg-paper relative">
              {children}
            </main>
          </WardGuard>
        </LiffAuthGuard>
      </body>
    </html>
  );
}
