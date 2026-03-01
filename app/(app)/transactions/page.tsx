import { Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTransactions } from "@/app/_actions/transaction-actions";
import { TransactionListActions } from "@/components/transaction-list-actions";
import { Button } from "@/components/ui/button";
import { getUser } from "@/lib/auth";

interface PageProps {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function buildPageHref(current: Record<string, string | undefined>, page: number): string {
	const params = new URLSearchParams();
	for (const [key, value] of Object.entries(current)) {
		if (value && key !== "page") params.set(key, value);
	}
	params.set("page", String(page));
	return `?${params.toString()}`;
}

export default async function TransactionsPage({ searchParams }: PageProps) {
	const user = await getUser();
	if (!user) redirect("/login");

	const raw = await searchParams;
	const params: Record<string, string | undefined> = {};
	for (const [key, value] of Object.entries(raw)) {
		params[key] = Array.isArray(value) ? value[0] : value;
	}

	const result = await getTransactions(params);

	if (!result.success) {
		return (
			<div className="flex flex-col gap-6 p-4 md:p-6">
				<h1 className="text-xl font-bold tracking-tight">取引一覧</h1>
				<p className="text-sm text-destructive">{result.error}</p>
			</div>
		);
	}

	const { transactions, total, page, perPage } = result.data;
	const totalPages = Math.ceil(total / perPage);

	return (
		<div className="flex flex-col gap-6 p-4 md:p-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-xl font-bold tracking-tight">取引一覧</h1>
					<p className="text-sm text-muted-foreground">{total}件の取引</p>
				</div>
				<Button asChild size="sm">
					<Link href="/transactions/new">
						<Plus className="mr-1 size-4" />
						新規作成
					</Link>
				</Button>
			</div>

			{transactions.length === 0 ? (
				<div className="rounded-lg border bg-card p-10 text-center text-card-foreground">
					<p className="text-sm text-muted-foreground">取引がありません。</p>
				</div>
			) : (
				<TransactionListActions transactions={transactions} />
			)}

			{totalPages > 1 && (
				<nav className="flex items-center justify-center gap-2" aria-label="ページネーション">
					{page > 1 && (
						<Link
							href={buildPageHref(params, page - 1)}
							className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
						>
							前へ
						</Link>
					)}
					<span className="text-sm text-muted-foreground">
						{page} / {totalPages}
					</span>
					{page < totalPages && (
						<Link
							href={buildPageHref(params, page + 1)}
							className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
						>
							次へ
						</Link>
					)}
				</nav>
			)}
		</div>
	);
}
