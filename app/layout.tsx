import type { Metadata } from "next";
import { Nunito_Sans } from "next/font/google";
import "./globals.css";
import { LayoutShell } from "@/components/layout-shell";
import { ToastProvider } from "@/components/toast";
import { ThemeProvider } from "@/components/theme";

const nunitoSans = Nunito_Sans({
  variable: "--font-nunito-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Karia Diamond LLP - Invoice Generator",
  description: "Generate domestic and export invoices for Karia Diamond LLP",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${nunitoSans.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full flex">
        <ThemeProvider>
          <ToastProvider>
            <LayoutShell>{children}</LayoutShell>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
