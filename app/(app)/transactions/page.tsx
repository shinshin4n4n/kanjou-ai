import { Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTransactions } from "@/app/_actions/transaction-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { getUser } from "@/lib/auth";
import { ACCOUNT_CATEGORIES } from "@/lib/utils/constants";

interface PageProps {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function accountName(code: string): string {
	const account = ACCOUNT_CATEGORIES[code as keyof typeof ACCOUNT_CATEGORIES];
	return account?.name ?? code;
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
				<div className="rounded-lg border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>日付</TableHead>
								<TableHead>摘要</TableHead>
								<TableHead className="text-right">金額</TableHead>
								<TableHead>借方</TableHead>
								<TableHead>貸方</TableHead>
								<TableHead>状態</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{transactions.map((tx) => (
								<TableRow key={tx.id} className="cursor-pointer">
									<TableCell className="whitespace-nowrap">
										<Link href={`/transactions/${tx.id}`} className="hover:underline">
											{tx.transaction_date}
										</Link>
									</TableCell>
									<TableCell>
										<Link href={`/transactions/${tx.id}`} className="hover:underline">
											{tx.description}
										</Link>
									</TableCell>
									<TableCell className="text-right whitespace-nowrap">
										{tx.amount.toLocaleString()}円
									</TableCell>
									<TableCell>{accountName(tx.debit_account)}</TableCell>
									<TableCell>{accountName(tx.credit_account)}</TableCell>
									<TableCell>
										<Badge variant={tx.is_confirmed ? "default" : "secondary"}>
											{tx.is_confirmed ? "確認済" : "未確認"}
										</Badge>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
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
