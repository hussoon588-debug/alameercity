import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "مدينة الأمير الرقمية | FAKSAB CITY — الملكية والمزادات والوكلاء في واجهة واحدة",
  description:
    "مدينة رقمية متكاملة تجمع الملكيات والمزادات الحية والرصيد والوكلاء والعملاء والمواعيد والعروض في تجربة مدينة ذكية بأسلوب الألعاب الحديثة.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="bg-[#060b1a] text-slate-100 antialiased min-h-screen">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
