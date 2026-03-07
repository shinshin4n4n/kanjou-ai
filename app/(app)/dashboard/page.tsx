import { addMonths, format, parse, subMonths } from "date-fns";
import { ja } from "date-fns/locale";
import { AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getDashboardData } from "@/app/_actions/dashboard-actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { getUser } from "@/lib/auth";

function formatCurrency(amount: number): string {
	return `¥${amount.toLocaleString()}`;
}

function getStatusLabel(status: string): string {
	switch (status) {
		case "completed":
			return "完了";
		case "failed":
			return "失敗";
		case "processing":
			return "処理中";
		default:
			return status;
	}
}

export default async function DashboardPage(props: { searchParams: Promise<{ month?: string }> }) {
	const user = await getUser();
	if (!user) redirect("/login");

	const searchParams = await props.searchParams;
	const currentMonth = searchParams.month ?? format(new Date(), "yyyy-MM");
	const monthDate = parse(currentMonth, "yyyy-MM", new Date());
	const prevMonth = format(subMonths(monthDate, 1), "yyyy-MM");
	const nextMonth = format(addMonths(monthDate, 1), "yyyy-MM");
	const monthLabel = format(monthDate, "yyyy年M月", { locale: ja });

	const result = await getDashboardData({ month: currentMonth });

	if (!result.success) {
		return (
			<div className="flex flex-col gap-6 p-4 md:p-6">
				<h1 className="text-xl font-bold tracking-tight">ダッシュボード</h1>
				<p className="text-sm text-destructive">{result.error}</p>
			</div>
		);
	}

	const { income, expense, balance, expenseBreakdown, unconfirmedCount, recentImports } =
		result.data;

	return (
		<div className="flex flex-col gap-6 p-4 md:p-6">
			{/* Header with month navigation */}
			<div className="flex items-center justify-between">
				<h1 className="text-xl font-bold tracking-tight">ダッシュボード</h1>
				<div className="flex items-center gap-2">
					<Link
						href={`/dashboard?month=${prevMonth}`}
						className="inline-flex h-8 w-8 items-center justify-center rounded-md border hover:bg-accent"
					>
						<ChevronLeft className="h-4 w-4" />
					</Link>
					<span className="min-w-[8rem] text-center text-sm font-medium">{monthLabel}</span>
					<Link
						href={`/dashboard?month=${nextMonth}`}
						className="inline-flex h-8 w-8 items-center justify-center rounded-md border hover:bg-accent"
					>
						<ChevronRight className="h-4 w-4" />
					</Link>
				</div>
			</div>

			{/* Monthly Summary Cards */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
				<Card>
					<CardHeader>
						<CardTitle className="text-sm font-medium text-muted-foreground">収入</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-2xl font-bold text-green-600">{formatCurrency(income)}</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle className="text-sm font-medium text-muted-foreground">支出</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-2xl font-bold text-red-600">{formatCurrency(expense)}</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle className="text-sm font-medium text-muted-foreground">差額</CardTitle>
					</CardHeader>
					<CardContent>
						<p className={`text-2xl font-bold ${balance >= 0 ? "text-green-600" : "text-red-600"}`}>
							{formatCurrency(balance)}
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Bottom section: Expense Breakdown + Side Panel */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
				{/* Expense Breakdown */}
				<Card className="md:col-span-2">
					<CardHeader>
						<CardTitle className="text-base">科目別内訳</CardTitle>
					</CardHeader>
					<CardContent>
						{expenseBreakdown.length === 0 ? (
							<p className="text-sm text-muted-foreground">取引データがありません</p>
						) : (
							<div className="space-y-3">
								{expenseBreakdown.map((item) => {
									const ratio = expense > 0 ? Math.round((item.amount / expense) * 100) : 0;
									return (
										<div key={item.code} className="flex items-center gap-3">
											<span className="w-24 text-sm truncate">{item.name}</span>
											<div className="flex-1 h-2 rounded-full bg-muted">
												<div
													className="h-2 rounded-full bg-primary"
													style={{ width: `${ratio}%` }}
												/>
											</div>
											<span className="w-20 text-right text-sm font-medium">
												{formatCurrency(item.amount)}
											</span>
											<span className="w-10 text-right text-xs text-muted-foreground">
												{ratio}%
											</span>
										</div>
									);
								})}
							</div>
						)}
					</CardContent>
				</Card>

				{/* Side Panel */}
				<div className="flex flex-col gap-4">
					{/* Unconfirmed Count */}
					<Card>
						<CardHeader>
							<CardTitle className="text-base flex items-center gap-2">
								<AlertCircle className="h-4 w-4" />
								未確認取引
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="flex items-center justify-between">
								<Badge variant={unconfirmedCount > 0 ? "destructive" : "secondary"}>
									{unconfirmedCount}件
								</Badge>
								<Link href="/transactions" className="text-sm text-primary hover:underline">
									取引一覧へ
								</Link>
							</div>
						</CardContent>
					</Card>

					{/* Recent Imports */}
					<Card>
						<CardHeader>
							<CardTitle className="text-base">直近インポート</CardTitle>
						</CardHeader>
						<CardContent>
							{recentImports.length === 0 ? (
								<p className="text-sm text-muted-foreground">インポート履歴がありません</p>
							) : (
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>ファイル</TableHead>
											<TableHead className="text-right">状態</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{recentImports.map((imp) => (
											<TableRow key={imp.id}>
												<TableCell className="text-xs truncate max-w-[120px]">
													{imp.fileName}
												</TableCell>
												<TableCell className="text-right">
													<Badge
														variant={
															imp.status === "completed"
																? "secondary"
																: imp.status === "failed"
																	? "destructive"
																	: "outline"
														}
													>
														{getStatusLabel(imp.status)}
														{imp.rowCount !== null && ` ${imp.rowCount}件`}
													</Badge>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							)}
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
