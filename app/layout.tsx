export const metadata = {
	title: "KanjouAI",
	description: "AI仕訳推定で確定申告をサポート",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="ja">
			<body>{children}</body>
		</html>
	);
}
