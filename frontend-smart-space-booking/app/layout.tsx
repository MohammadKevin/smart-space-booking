import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-jakarta",
});

export const metadata: Metadata = {
  title: "WorkNest | Coworking & Meeting Space Platform",
  description:
    "Reservasi instan coworking space, meeting room, dan private office dengan QR Code check-in cerdas dan harga transparan.",
  icons: {
    icon: "/icon-web.png",
    shortcut: "/icon-web.png",
    apple: "/icon-web.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`h-full bg-white antialiased ${jakarta.className}`}>
      <body className="min-h-full flex flex-col bg-white text-slate-900 selection:bg-cyan-500 selection:text-white">
        <AuthProvider>
          <Navbar />
          <main className="flex-1 flex flex-col">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
