import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "okno",
  description:
    "Минималистичный сервис онлайн-записи для начинающих мастеров маникюра и бровей.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className="h-full antialiased"
      data-scroll-behavior="smooth"
    >
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
