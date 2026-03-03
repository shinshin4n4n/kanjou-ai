"use client";

import { useState } from "react";
import type { AiClassificationRow } from "@/app/_actions/ai-classify-actions";
import { ACCOUNT_CATEGORIES } from "@/lib/utils/constants";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "./ui/dialog";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "./ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
	expense: "経費",
	income: "収益",
	asset: "資産",
	liability: "負債",
};

interface EditableRow {
	id: string;
	debitAccount: string;
	creditAccount: string;
	confidence: "HIGH" | "MEDIUM" | "LOW";
}

function ConfidenceBadge({ confidence }: { confidence: "HIGH" | "MEDIUM" | "LOW" }) {
	if (confidence === "HIGH") return <Badge className="bg-green-600 text-white">HIGH</Badge>;
	if (confidence === "MEDIUM") return <Badge className="bg-yellow-500 text-white">MEDIUM</Badge>;
	return <Badge className="bg-red-500 text-white">LOW</Badge>;
}

function AccountCodeSelect({
	value,
	onValueChange,
}: {
	value: string;
	onValueChange: (v: string) => void;
}) {
	const grouped = Object.groupBy(Object.entries(ACCOUNT_CATEGORIES), ([, v]) => v.type);

	return (
		<Select value={value} onValueChange={onValueChange}>
			<SelectTrigger className="h-8 w-[130px] text-xs">
				<SelectValue />
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
	);
}

interface AiClassifyDialogProps {
	results: AiClassificationRow[] | null;
	open: boolean;
	onClose: () => void;
	onApply: (rows: EditableRow[]) => Promise<void>;
}

export function AiClassifyDialog({ results, open, onClose, onApply }: AiClassifyDialogProps) {
	const [editable, setEditable] = useState<EditableRow[]>([]);
	const [applying, setApplying] = useState(false);

	function handleOpenChange(isOpen: boolean) {
		if (isOpen && results) {
			setEditable(
				results.map((r) => ({
					id: r.id,
					debitAccount: r.debitAccount,
					creditAccount: r.creditAccount,
					confidence: r.confidence,
				})),
			);
		}
		if (!isOpen) onClose();
	}

	function updateRow(index: number, field: "debitAccount" | "creditAccount", value: string) {
		setEditable((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
	}

	async function handleApply() {
		setApplying(true);
		await onApply(editable);
		setApplying(false);
	}

	if (!results) return null;

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>AI仕訳推定結果</DialogTitle>
					<DialogDescription>
						{results.length}件の推定結果を確認してください。科目は変更可能です。
					</DialogDescription>
				</DialogHeader>
				<div className="rounded-lg border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>摘要</TableHead>
								<TableHead className="text-right">金額</TableHead>
								<TableHead>借方</TableHead>
								<TableHead>貸方</TableHead>
								<TableHead>確度</TableHead>
								<TableHead>理由</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{results.map((row, i) => (
								<TableRow key={row.id}>
									<TableCell className="max-w-[150px] truncate" title={row.description}>
										{row.description}
									</TableCell>
									<TableCell className="text-right whitespace-nowrap">
										{row.amount.toLocaleString()}円
									</TableCell>
									<TableCell>
										<AccountCodeSelect
											value={editable[i]?.debitAccount ?? row.debitAccount}
											onValueChange={(v) => updateRow(i, "debitAccount", v)}
										/>
									</TableCell>
									<TableCell>
										<AccountCodeSelect
											value={editable[i]?.creditAccount ?? row.creditAccount}
											onValueChange={(v) => updateRow(i, "creditAccount", v)}
										/>
									</TableCell>
									<TableCell>
										<ConfidenceBadge confidence={row.confidence} />
									</TableCell>
									<TableCell
										className="max-w-[150px] truncate text-sm text-muted-foreground"
										title={row.reason}
									>
										{row.reason}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={onClose} disabled={applying}>
						キャンセル
					</Button>
					<Button onClick={handleApply} disabled={applying}>
						{applying ? "適用中…" : `${results.length}件を承認`}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
