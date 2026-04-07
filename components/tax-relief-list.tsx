"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import {
	createTaxRelief,
	deleteTaxRelief,
	updateTaxRelief,
} from "@/app/_actions/tax-relief-actions";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/lib/types/supabase";
import { TAX_RELIEF_CATEGORIES, type TaxReliefCode } from "@/lib/utils/tax-reliefs";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "./ui/alert-dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";

type TaxReliefRecord = Tables<"tax_relief_records">;

function reliefName(code: string): string {
	const cat = TAX_RELIEF_CATEGORIES[code as TaxReliefCode];
	return cat?.name ?? code;
}

const reliefCodes = Object.keys(TAX_RELIEF_CATEGORIES) as TaxReliefCode[];
const defaultCode: string = reliefCodes[0] ?? "TR001";
const DEFAULT_CODE = reliefCodes[0] ?? "TR001";

interface TaxReliefListProps {
	records: TaxReliefRecord[];
	assessmentYear: string;
}

export function TaxReliefList({ records, assessmentYear }: TaxReliefListProps) {
	const [showForm, setShowForm] = useState(false);
	const [editId, setEditId] = useState<string | null>(null);
	const [deleteId, setDeleteId] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const { toast } = useToast();

	// Form state
	const [reliefCode, setReliefCode] = useState<string>(DEFAULT_CODE);
	const [amount, setAmount] = useState("");
	const [receiptDate, setReceiptDate] = useState("");
	const [description, setDescription] = useState("");

	function resetForm() {
		setReliefCode(DEFAULT_CODE);
		setAmount("");
		setReceiptDate("");
		setDescription("");
	}

	function startEdit(record: TaxReliefRecord) {
		setEditId(record.id);
		setReliefCode(record.relief_code);
		setAmount(String(record.amount));
		setReceiptDate(record.receipt_date);
		setDescription(record.description ?? "");
		setShowForm(false);
	}

	async function handleSave() {
		setLoading(true);
		if (editId) {
			const result = await updateTaxRelief({
				id: editId,
				relief_code: reliefCode,
				amount: Number(amount),
				receipt_date: receiptDate,
				description: description || undefined,
			});
			if (result.success) {
				toast({ title: "控除記録を更新しました" });
				setEditId(null);
				resetForm();
			} else {
				toast({ title: "更新に失敗しました", description: result.error, variant: "destructive" });
			}
		} else {
			const result = await createTaxRelief({
				relief_code: reliefCode,
				assessment_year: assessmentYear,
				amount: Number(amount),
				receipt_date: receiptDate,
				description: description || undefined,
			});
			if (result.success) {
				toast({ title: "控除記録を追加しました" });
				setShowForm(false);
				resetForm();
			} else {
				toast({ title: "追加に失敗しました", description: result.error, variant: "destructive" });
			}
		}
		setLoading(false);
	}

	async function handleDelete() {
		if (!deleteId) return;
		setLoading(true);
		const result = await deleteTaxRelief(deleteId);
		if (result.success) {
			toast({ title: "控除記録を削除しました" });
		} else {
			toast({ title: "削除に失敗しました", description: result.error, variant: "destructive" });
		}
		setDeleteId(null);
		setLoading(false);
	}

	const formRow = (
		<TableRow>
			<TableCell>
				<Select value={reliefCode} onValueChange={setReliefCode}>
					<SelectTrigger className="w-48">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{reliefCodes.map((code) => (
							<SelectItem key={code} value={code}>
								{TAX_RELIEF_CATEGORIES[code].name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</TableCell>
			<TableCell>
				<Label htmlFor="tax-relief-amount" className="sr-only">
					金額
				</Label>
				<Input
					id="tax-relief-amount"
					type="number"
					value={amount}
					onChange={(e) => setAmount(e.target.value)}
					placeholder="金額"
					className="w-28"
				/>
			</TableCell>
			<TableCell>
				<Label htmlFor="tax-relief-date" className="sr-only">
					日付
				</Label>
				<Input
					id="tax-relief-date"
					type="date"
					value={receiptDate}
					onChange={(e) => setReceiptDate(e.target.value)}
					className="w-36"
				/>
			</TableCell>
			<TableCell>
				<Input
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					placeholder="説明（任意）"
					className="w-40"
				/>
			</TableCell>
			<TableCell>
				<div className="flex gap-1">
					<Button size="sm" onClick={handleSave} disabled={loading}>
						保存
					</Button>
					<Button
						size="sm"
						variant="ghost"
						onClick={() => {
							setShowForm(false);
							setEditId(null);
							resetForm();
						}}
					>
						キャンセル
					</Button>
				</div>
			</TableCell>
		</TableRow>
	);

	return (
		<>
			{!showForm && !editId && (
				<div className="flex justify-end">
					<Button
						size="sm"
						onClick={() => {
							resetForm();
							setShowForm(true);
						}}
					>
						<Plus className="mr-1 size-4" />
						追加
					</Button>
				</div>
			)}

			{records.length === 0 && !showForm ? (
				<div className="rounded-lg border bg-card p-10 text-center text-card-foreground">
					<p className="text-sm text-muted-foreground">控除記録がありません。</p>
				</div>
			) : (
				<div className="rounded-lg border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>控除項目</TableHead>
								<TableHead>金額 (RM)</TableHead>
								<TableHead>日付</TableHead>
								<TableHead>説明</TableHead>
								<TableHead className="w-20" />
							</TableRow>
						</TableHeader>
						<TableBody>
							{showForm && formRow}
							{records.map((rec) =>
								editId === rec.id ? (
									<tr key={rec.id}>{formRow.props.children}</tr>
								) : (
									<TableRow key={rec.id}>
										<TableCell>{reliefName(rec.relief_code)}</TableCell>
										<TableCell>{rec.amount.toLocaleString()}</TableCell>
										<TableCell>{rec.receipt_date}</TableCell>
										<TableCell>{rec.description ?? ""}</TableCell>
										<TableCell>
											<div className="flex gap-1">
												<Button
													size="icon"
													variant="ghost"
													className="size-8"
													onClick={() => startEdit(rec)}
													title="編集"
												>
													<Pencil className="size-4" />
												</Button>
												<Button
													size="icon"
													variant="ghost"
													className="size-8 text-destructive hover:text-destructive"
													onClick={() => setDeleteId(rec.id)}
													title="削除"
												>
													<Trash2 className="size-4" />
												</Button>
											</div>
										</TableCell>
									</TableRow>
								),
							)}
						</TableBody>
					</Table>
				</div>
			)}

			<AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>この控除記録を削除しますか？</AlertDialogTitle>
						<AlertDialogDescription>この操作は取り消せます。</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>キャンセル</AlertDialogCancel>
						<AlertDialogAction onClick={handleDelete}>削除</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
