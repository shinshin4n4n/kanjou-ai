"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createTransaction, updateTransaction } from "@/app/_actions/transaction-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Tables } from "@/lib/types/supabase";
import { ACCOUNT_CATEGORIES, TAX_CATEGORIES } from "@/lib/utils/constants";

type Transaction = Tables<"transactions">;

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
	expense: "経費",
	income: "収益",
	asset: "資産",
	liability: "負債",
};

function AccountSelect({
	id,
	label,
	value,
	onValueChange,
}: {
	id: string;
	label: string;
	value: string;
	onValueChange: (v: string) => void;
}) {
	const grouped = Object.groupBy(Object.entries(ACCOUNT_CATEGORIES), ([, v]) => v.type);

	return (
		<div className="space-y-2">
			<Label htmlFor={id}>{label}</Label>
			<Select value={value} onValueChange={onValueChange}>
				<SelectTrigger id={id}>
					<SelectValue placeholder="勘定科目を選択" />
				</SelectTrigger>
				<SelectContent>
					{Object.entries(grouped).map(([type, entries]) => (
						<SelectGroup key={type}>
							<SelectLabel>{ACCOUNT_TYPE_LABELS[type] ?? type}</SelectLabel>
							{entries?.map(([code, { name }]) => (
								<SelectItem key={code} value={code}>
									{name}
								</SelectItem>
							))}
						</SelectGroup>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}

interface TransactionFormProps {
	transaction?: Transaction;
}

export function TransactionForm({ transaction }: TransactionFormProps) {
	const router = useRouter();
	const isEdit = !!transaction;

	const [transactionDate, setTransactionDate] = useState(transaction?.transaction_date ?? "");
	const [description, setDescription] = useState(transaction?.description ?? "");
	const [amount, setAmount] = useState(transaction?.amount?.toString() ?? "");
	const [debitAccount, setDebitAccount] = useState(transaction?.debit_account ?? "");
	const [creditAccount, setCreditAccount] = useState(transaction?.credit_account ?? "");
	const [taxCategory, setTaxCategory] = useState(transaction?.tax_category ?? "");
	const [memo, setMemo] = useState(transaction?.memo ?? "");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	async function handleSubmit() {
		setError("");
		setLoading(true);

		const input = {
			transactionDate,
			description,
			amount: Number(amount),
			debitAccount,
			creditAccount,
			...(taxCategory && { taxCategory }),
			...(memo && { memo }),
		};

		const result = isEdit
			? await updateTransaction({ id: transaction.id, ...input })
			: await createTransaction(input);

		if (result.success) {
			router.push("/transactions");
		} else {
			setError(result.error);
		}
		setLoading(false);
	}

	return (
		<Card className="max-w-lg">
			<CardHeader>
				<CardTitle>{isEdit ? "取引編集" : "新規取引"}</CardTitle>
			</CardHeader>
			<CardContent>
				<form action={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="transactionDate">日付</Label>
						<Input
							id="transactionDate"
							type="date"
							value={transactionDate}
							onChange={(e) => setTransactionDate(e.target.value)}
							required
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="description">摘要</Label>
						<Input
							id="description"
							type="text"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							maxLength={200}
							placeholder="取引の内容を入力"
							required
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="amount">金額（円）</Label>
						<Input
							id="amount"
							type="number"
							value={amount}
							onChange={(e) => setAmount(e.target.value)}
							min={1}
							max={999999999}
							placeholder="0"
							required
						/>
					</div>

					<AccountSelect
						id="debitAccount"
						label="借方勘定科目"
						value={debitAccount}
						onValueChange={setDebitAccount}
					/>

					<AccountSelect
						id="creditAccount"
						label="貸方勘定科目"
						value={creditAccount}
						onValueChange={setCreditAccount}
					/>

					<div className="space-y-2">
						<Label htmlFor="taxCategory">税区分（任意）</Label>
						<Select value={taxCategory} onValueChange={setTaxCategory}>
							<SelectTrigger id="taxCategory">
								<SelectValue placeholder="選択なし" />
							</SelectTrigger>
							<SelectContent>
								{Object.entries(TAX_CATEGORIES).map(([key, { name }]) => (
									<SelectItem key={key} value={key}>
										{name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<Label htmlFor="memo">メモ（任意）</Label>
						<Textarea
							id="memo"
							value={memo}
							onChange={(e) => setMemo(e.target.value)}
							maxLength={500}
							placeholder="メモを入力"
							rows={2}
						/>
					</div>

					{error && <p className="text-sm text-destructive">{error}</p>}

					<div className="flex gap-2">
						<Button type="submit" disabled={loading} className="flex-1">
							{loading ? "保存中..." : "保存"}
						</Button>
						<Button type="button" variant="outline" onClick={() => router.push("/transactions")}>
							キャンセル
						</Button>
					</div>
				</form>
			</CardContent>
		</Card>
	);
}
