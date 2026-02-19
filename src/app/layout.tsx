import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Outfit } from "next/font/google";
import "./globals.css";
import { Toaster } from "sileo";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "PeopleFlow",
    template: "%s | PeopleFlow",
  },
  description:
    "PeopleFlow es un sistema ERP empresarial para gestión integral de recursos humanos, reclutamiento, finanzas, clientes y ventas.",
  keywords: [
    "ERP",
    "recursos humanos",
    "reclutamiento",
    "finanzas",
    "gestión de personal",
    "PeopleFlow",
    "sistema empresarial",
  ],
  authors: [{ name: "PeopleFlow" }],
  creator: "PeopleFlow",
  publisher: "PeopleFlow",
  applicationName: "PeopleFlow ERP",
  category: "business",
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    type: "website",
    locale: "es_MX",
    siteName: "PeopleFlow ERP",
    title: "PeopleFlow — Sistema ERP Empresarial",
    description:
      "Gestión integral de recursos humanos, reclutamiento, finanzas y ventas en una sola plataforma.",
  },
  twitter: {
    card: "summary_large_image",
    title: "PeopleFlow — Sistema ERP Empresarial",
    description:
      "Gestión integral de recursos humanos, reclutamiento, finanzas y ventas en una sola plataforma.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <html lang="es" className={outfit.variable}>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          {children}
          <Toaster
            position="top-center"
            offset={{ top: 16 }}
            options={{
              duration: 4000,
              roundness: 12,
            }}
          />
          {process.env.NODE_ENV === "production" && (
            <script
              src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
              async
              defer
            ></script>
          )}
        </body>
      </html>
    </>
  );
}
