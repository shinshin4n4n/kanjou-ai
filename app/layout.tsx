import type { Metadata, Viewport } from "next";
import { Geist_Mono, Noto_Sans_JP } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

const notoSansJP = Noto_Sans_JP({
	subsets: ["latin"],
	weight: ["400", "500", "600", "700"],
	variable: "--font-sans",
});

const geistMono = Geist_Mono({
	subsets: ["latin"],
	variable: "--font-mono",
});

const description =
	"フリーランスの確定申告仕訳をAIで一括処理。CSV取込、勘定科目自動推定、弥生・freee形式エクスポート対応。";

export const metadata: Metadata = {
	metadataBase: new URL("https://kanjou-ai.vercel.app"),
	title: "KanjouAI - AI仕訳管理",
	description,
	keywords: ["確定申告", "仕訳", "AI", "フリーランス", "会計", "CSV", "勘定科目"],
	authors: [{ name: "KanjouAI" }],
	openGraph: {
		title: "KanjouAI - AI仕訳管理",
		description,
		url: "https://kanjou-ai.vercel.app",
		siteName: "KanjouAI",
		locale: "ja_JP",
		type: "website",
	},
	twitter: {
		card: "summary",
		title: "KanjouAI - AI仕訳管理",
		description,
	},
};

export const viewport: Viewport = {
	themeColor: "#2b3a5c",
	width: "device-width",
	initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="ja" suppressHydrationWarning>
			<body className={`${notoSansJP.variable} ${geistMono.variable} font-sans antialiased`}>
				<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
					{children}
					<Toaster />
				</ThemeProvider>
			</body>
		</html>
	);
}
