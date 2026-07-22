import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import { AppProviders } from "@/components/providers/app-providers";
import "./globals.css";

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-be-vietnam-pro",
  display: "swap"
});

export const metadata: Metadata = {
  title: "EnergyInsight | BESS Planner",
  description: "Nền tảng phân tích và lập kế hoạch BESS cho doanh nghiệp."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={beVietnamPro.variable}>
      <body className="font-sans antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
