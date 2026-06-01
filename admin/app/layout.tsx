import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "夜道見守り 管理画面",
  description: "夜道見守りアプリの通知管理画面"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
