import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";

export default async function DashboardPage() {
	const user = await getUser();

	if (!user) {
		redirect("/login");
	}

	return (
		<div className="flex flex-col gap-6 p-4 md:p-6">
			<div>
				<h1 className="text-xl font-bold tracking-tight">ダッシュボード</h1>
				<p className="text-sm text-muted-foreground">ログイン中: {user.email}</p>
			</div>
			<div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
				<p className="text-sm text-muted-foreground">
					ダッシュボードの詳細コンテンツは今後追加予定です。
				</p>
			</div>
		</div>
	);
}
