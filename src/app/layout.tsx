import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Outfit } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import {
  CheckmarkCircle02Icon,
  InformationCircleIcon,
  Alert02Icon,
  Cancel01Icon,
  Loading03Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

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
      <Toaster
        position="top-center"
        expand
        duration={4000}
        toastOptions={{
          className: "font-sans",
          style: {
            "--toast-duration": "4000ms",
          } as React.CSSProperties,
        }}
        icons={{
          success: (
            <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-4" />
          ),
          info: (
            <HugeiconsIcon icon={InformationCircleIcon} className="size-4" />
          ),
          warning: <HugeiconsIcon icon={Alert02Icon} className="size-4" />,
          error: <HugeiconsIcon icon={Cancel01Icon} className="size-4" />,
          loading: (
            <HugeiconsIcon
              icon={Loading03Icon}
              className="size-4 animate-spin"
            />
          ),
        }}
      />

      <html lang="es" className={outfit.variable}>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          {children}
          <script
            src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
            async
            defer
          ></script>
        </body>
      </html>
    </>
  );
}
