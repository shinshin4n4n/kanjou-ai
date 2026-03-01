"use client";

import { Check, CheckCheck, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
	bulkConfirmTransactions,
	confirmTransaction,
	softDeleteTransaction,
} from "@/app/_actions/transaction-actions";
import type { Tables } from "@/lib/types/supabase";
import { ACCOUNT_CATEGORIES } from "@/lib/utils/constants";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "./ui/alert-dialog";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";

type Transaction = Tables<"transactions">;

function accountName(code: string): string {
	const account = ACCOUNT_CATEGORIES[code as keyof typeof ACCOUNT_CATEGORIES];
	return account?.name ?? code;
}

interface TransactionListActionsProps {
	transactions: Transaction[];
}

export function TransactionListActions({ transactions }: TransactionListActionsProps) {
	const [selected, setSelected] = useState<Set<string>>(new Set());
	const [loading, setLoading] = useState(false);

	const unconfirmed = transactions.filter((tx) => !tx.is_confirmed);
	const allSelected = unconfirmed.length > 0 && unconfirmed.every((tx) => selected.has(tx.id));

	function toggleSelect(id: string) {
		setSelected((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	}

	function toggleAll() {
		if (allSelected) {
			setSelected(new Set());
		} else {
			setSelected(new Set(unconfirmed.map((tx) => tx.id)));
		}
	}

	async function handleDelete(id: string) {
		setLoading(true);
		await softDeleteTransaction(id);
		setSelected((prev) => {
			const next = new Set(prev);
			next.delete(id);
			return next;
		});
		setLoading(false);
	}

	async function handleConfirm(id: string) {
		setLoading(true);
		await confirmTransaction(id);
		setSelected((prev) => {
			const next = new Set(prev);
			next.delete(id);
			return next;
		});
		setLoading(false);
	}

	async function handleBulkConfirm() {
		if (selected.size === 0) return;
		setLoading(true);
		await bulkConfirmTransactions([...selected]);
		setSelected(new Set());
		setLoading(false);
	}

	return (
		<>
			{selected.size > 0 && (
				<div className="flex items-center gap-3 rounded-lg border bg-muted/50 px-4 py-2">
					<span className="text-sm font-medium">{selected.size}件選択中</span>
					<Button size="sm" variant="outline" onClick={handleBulkConfirm} disabled={loading}>
						<CheckCheck className="mr-1 size-4" />
						一括確認
					</Button>
				</div>
			)}

			<div className="rounded-lg border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="w-10">
								<Checkbox
									checked={allSelected}
									onCheckedChange={toggleAll}
									aria-label="全選択"
									disabled={unconfirmed.length === 0}
								/>
							</TableHead>
							<TableHead>日付</TableHead>
							<TableHead>摘要</TableHead>
							<TableHead className="text-right">金額</TableHead>
							<TableHead>借方</TableHead>
							<TableHead>貸方</TableHead>
							<TableHead>状態</TableHead>
							<TableHead className="w-20" />
						</TableRow>
					</TableHeader>
					<TableBody>
						{transactions.map((tx) => (
							<TableRow key={tx.id}>
								<TableCell>
									{!tx.is_confirmed && (
										<Checkbox
											checked={selected.has(tx.id)}
											onCheckedChange={() => toggleSelect(tx.id)}
											aria-label={`${tx.description}を選択`}
										/>
									)}
								</TableCell>
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
								<TableCell>
									<div className="flex items-center gap-1">
										{!tx.is_confirmed && (
											<Button
												size="icon"
												variant="ghost"
												className="size-8"
												onClick={() => handleConfirm(tx.id)}
												disabled={loading}
												title="確認済みにする"
											>
												<Check className="size-4" />
											</Button>
										)}
										<AlertDialog>
											<AlertDialogTrigger asChild>
												<Button
													size="icon"
													variant="ghost"
													className="size-8 text-destructive hover:text-destructive"
													disabled={loading}
													title="削除"
												>
													<Trash2 className="size-4" />
												</Button>
											</AlertDialogTrigger>
											<AlertDialogContent>
												<AlertDialogHeader>
													<AlertDialogTitle>取引を削除しますか？</AlertDialogTitle>
													<AlertDialogDescription>
														「{tx.description}」を削除します。この操作は取り消せます。
													</AlertDialogDescription>
												</AlertDialogHeader>
												<AlertDialogFooter>
													<AlertDialogCancel>キャンセル</AlertDialogCancel>
													<AlertDialogAction onClick={() => handleDelete(tx.id)}>
														削除
													</AlertDialogAction>
												</AlertDialogFooter>
											</AlertDialogContent>
										</AlertDialog>
									</div>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
		</>
	);
}
