import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NIRAMAYAH | Precision Cardiac Diagnosis",
  description: "Pre-diagnostic cardiac risk assessment platform using AI-assisted screening.",
  icons: {
    icon: '/icon?v=3',
    apple: '/icon?v=3',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans text-niramayah-gray bg-niramayah-light">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
