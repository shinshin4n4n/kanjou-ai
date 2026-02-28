import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";

export default async function DashboardPage() {
	const user = await getUser();

	if (!user) {
		redirect("/login");
	}

	return (
		<div style={{ maxWidth: 600, margin: "40px auto", padding: "0 16px" }}>
			<h1 style={{ fontSize: 24, marginBottom: 16 }}>ダッシュボード</h1>
			<p>ログイン中: {user.email}</p>
		</div>
	);
}
