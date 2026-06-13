import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://buy0050.com"),
  title: "buy0050.com｜大家覺得這個網站可以做什麼？",
  description: "我買了一個網址 buy0050.com，目前還沒有好點子。歡迎留下建議、貼 0050 對帳單、看看 0050 走勢。",
  openGraph: {
    title: "buy0050.com｜大家覺得這個網站可以做什麼？",
    description: "留言、投稿、貼 0050 對帳單，幫 buy0050.com 想一個方向。",
    url: "https://buy0050.com",
    siteName: "buy0050.com",
    type: "website",
    locale: "zh_TW"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
