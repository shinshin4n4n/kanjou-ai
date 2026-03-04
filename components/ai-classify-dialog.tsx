"use client";

import { Save, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { AiClassificationRow } from "@/app/_actions/ai-classify-actions";
import {
	type ClassificationRule,
	deleteClassificationRule,
	getClassificationRules,
	saveClassificationRule,
} from "@/app/_actions/classification-rule-actions";
import { useToast } from "@/hooks/use-toast";
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
import { Textarea } from "./ui/textarea";

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
	expense: "経費",
	income: "収益",
	asset: "資産",
	liability: "負債",
};

type Confidence = "HIGH" | "MEDIUM" | "LOW" | "MANUAL";

interface EditableRow {
	id: string;
	debitAccount: string;
	creditAccount: string;
	confidence: Confidence;
}

function ConfidenceBadge({ confidence }: { confidence: Confidence }) {
	if (confidence === "MANUAL") return <Badge className="bg-blue-600 text-white">MANUAL</Badge>;
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
	onReClassify: (instruction: string) => Promise<void>;
	classifying?: boolean;
}

export function AiClassifyDialog({
	results,
	open,
	onClose,
	onApply,
	onReClassify,
	classifying,
}: AiClassifyDialogProps) {
	const [editable, setEditable] = useState<EditableRow[]>([]);
	const [applying, setApplying] = useState(false);
	const [instruction, setInstruction] = useState("");
	const [rules, setRules] = useState<ClassificationRule[]>([]);
	const { toast } = useToast();

	useEffect(() => {
		if (results) {
			setEditable(
				results.map((r) => ({
					id: r.id,
					debitAccount: r.debitAccount,
					creditAccount: r.creditAccount,
					confidence: r.confidence,
				})),
			);
		}
	}, [results]);

	useEffect(() => {
		if (open) {
			getClassificationRules().then((res) => {
				if (res.success) {
					setRules(res.data);
				} else {
					toast({ title: "ルールの取得に失敗しました", variant: "destructive" });
				}
			});
		}
	}, [open, toast]);

	function handleOpenChange(isOpen: boolean) {
		if (!isOpen) {
			setInstruction("");
			onClose();
		}
	}

	function updateRow(index: number, field: "debitAccount" | "creditAccount", value: string) {
		setEditable((prev) =>
			prev.map((row, i) =>
				i === index ? { ...row, [field]: value, confidence: "MANUAL" as const } : row,
			),
		);
	}

	async function handleApply() {
		setApplying(true);
		await onApply(editable);
		setApplying(false);
	}

	async function handleReClassify() {
		await onReClassify(instruction);
	}

	async function handleSaveRule() {
		if (!instruction.trim()) return;
		const result = await saveClassificationRule(instruction.trim());
		if (result.success) {
			setRules((prev) => [result.data, ...prev]);
			toast({ title: "ルールを保存しました" });
		} else {
			toast({ title: "ルールの保存に失敗しました", variant: "destructive" });
		}
	}

	async function handleDeleteRule(id: string) {
		const result = await deleteClassificationRule(id);
		if (result.success) {
			setRules((prev) => prev.filter((r) => r.id !== id));
		} else {
			toast({ title: "ルールの削除に失敗しました", variant: "destructive" });
		}
	}

	if (!results) return null;

	const busy = applying || !!classifying;

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>AI仕訳推定結果</DialogTitle>
					<DialogDescription>
						{results.length}件の推定結果を確認してください。科目は変更可能です。
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-2">
					<div className="flex items-end gap-2">
						<Textarea
							placeholder="指示を入力（例: AWSの利用料は通信費にしてください）"
							value={instruction}
							onChange={(e) => setInstruction(e.target.value)}
							rows={2}
							className="flex-1"
							disabled={busy}
						/>
						<div className="flex flex-col gap-1">
							<Button
								variant="outline"
								size="sm"
								onClick={handleReClassify}
								disabled={busy || !instruction.trim()}
							>
								<Sparkles className="mr-1 size-4" />
								{classifying ? "推定中…" : "再推定"}
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={handleSaveRule}
								disabled={busy || !instruction.trim()}
							>
								<Save className="mr-1 size-4" />
								保存
							</Button>
						</div>
					</div>
					{rules.length > 0 && (
						<div className="flex flex-wrap gap-1">
							{rules.map((rule) => (
								<div
									key={rule.id}
									role="button"
									tabIndex={0}
									className="inline-flex items-center gap-1 rounded-full border bg-muted/50 px-3 py-1 text-xs hover:bg-muted aria-disabled:opacity-50"
									onClick={() => !busy && setInstruction(rule.instruction)}
									onKeyDown={(e) => {
										if (!busy && (e.key === "Enter" || e.key === " ")) {
											e.preventDefault();
											setInstruction(rule.instruction);
										}
									}}
									aria-disabled={busy}
								>
									<span className="max-w-[200px] truncate">{rule.instruction}</span>
									<button
										type="button"
										className="ml-1 rounded-full p-0.5 hover:bg-destructive/20"
										onClick={(e) => {
											e.stopPropagation();
											handleDeleteRule(rule.id);
										}}
									>
										<X className="size-3" />
									</button>
								</div>
							))}
						</div>
					)}
				</div>
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
										<ConfidenceBadge confidence={editable[i]?.confidence ?? row.confidence} />
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
					<Button variant="outline" onClick={onClose} disabled={busy}>
						キャンセル
					</Button>
					<Button onClick={handleApply} disabled={busy}>
						{applying ? "適用中…" : `${results.length}件を承認`}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
