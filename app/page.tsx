import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
	return (
		<main className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
			<div className="text-center">
				<h1 className="text-4xl font-bold tracking-tight">KanjouAI</h1>
				<p className="mt-2 text-muted-foreground">AI仕訳管理で確定申告をサポート</p>
			</div>
			<Button asChild>
				<Link href="/login">ログイン</Link>
			</Button>
		</main>
	);
}
