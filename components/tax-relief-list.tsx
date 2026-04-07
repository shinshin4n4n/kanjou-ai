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
import { Button } from "./ui/button";

type TaxReliefRecord = Tables<"tax_relief_records">;
const CODES = Object.keys(TAX_RELIEF_CATEGORIES) as TaxReliefCode[];
const DEFAULT_CODE = CODES[0] ?? "TR001";
const name = (c: string) => TAX_RELIEF_CATEGORIES[c as TaxReliefCode]?.name ?? c;
const inputCls = "w-full rounded border px-2 py-1 text-sm bg-background";

interface Props {
	records: TaxReliefRecord[];
	assessmentYear: string;
}

export function TaxReliefList({ records, assessmentYear }: Props) {
	const [mode, setMode] = useState<"idle" | "add" | string>("idle");
	const [loading, setLoading] = useState(false);
	const { toast } = useToast();
	const [code, setCode] = useState<string>(DEFAULT_CODE);
	const [amt, setAmt] = useState("");
	const [date, setDate] = useState("");
	const [desc, setDesc] = useState("");

	const reset = () => {
		setCode(DEFAULT_CODE);
		setAmt("");
		setDate("");
		setDesc("");
	};
	const cancel = () => {
		setMode("idle");
		reset();
	};
	const startAdd = () => {
		reset();
		setMode("add");
	};
	const startEdit = (r: TaxReliefRecord) => {
		setCode(r.relief_code);
		setAmt(String(r.amount));
		setDate(r.receipt_date);
		setDesc(r.description ?? "");
		setMode(r.id);
	};

	async function handleSave() {
		setLoading(true);
		const isEdit = mode !== "add";
		const result = isEdit
			? await updateTaxRelief({
					id: mode,
					relief_code: code,
					amount: Number(amt),
					receipt_date: date,
					description: desc || undefined,
				})
			: await createTaxRelief({
					relief_code: code,
					assessment_year: assessmentYear,
					amount: Number(amt),
					receipt_date: date,
					description: desc || undefined,
				});
		if (result.success) {
			toast({ title: isEdit ? "更新しました" : "追加しました" });
			cancel();
		} else {
			toast({ title: "失敗しました", description: result.error, variant: "destructive" });
		}
		setLoading(false);
	}

	async function handleDelete(id: string) {
		if (!window.confirm("この控除記録を削除しますか？")) return;
		setLoading(true);
		const result = await deleteTaxRelief(id);
		if (result.success) toast({ title: "削除しました" });
		else toast({ title: "削除に失敗しました", description: result.error, variant: "destructive" });
		setLoading(false);
	}

	const form = (
		<div className="grid grid-cols-2 gap-2 rounded-lg border bg-muted/30 p-3 sm:grid-cols-4">
			<div>
				<label htmlFor="tax-relief-code" className="text-xs text-muted-foreground">
					控除項目
				</label>
				<select
					id="tax-relief-code"
					value={code}
					onChange={(e) => setCode(e.target.value)}
					className={inputCls}
				>
					{CODES.map((c) => (
						<option key={c} value={c}>
							{TAX_RELIEF_CATEGORIES[c].name}
						</option>
					))}
				</select>
			</div>
			<div>
				<label htmlFor="tax-relief-amount" className="text-xs text-muted-foreground">
					金額
				</label>
				<input
					id="tax-relief-amount"
					type="number"
					value={amt}
					onChange={(e) => setAmt(e.target.value)}
					className={inputCls}
				/>
			</div>
			<div>
				<label htmlFor="tax-relief-date" className="text-xs text-muted-foreground">
					日付
				</label>
				<input
					id="tax-relief-date"
					type="date"
					value={date}
					onChange={(e) => setDate(e.target.value)}
					className={inputCls}
				/>
			</div>
			<div>
				<label htmlFor="tax-relief-desc" className="text-xs text-muted-foreground">
					説明
				</label>
				<input
					id="tax-relief-desc"
					value={desc}
					onChange={(e) => setDesc(e.target.value)}
					className={inputCls}
				/>
			</div>
			<div className="col-span-2 flex gap-2 sm:col-span-4">
				<Button size="sm" onClick={handleSave} disabled={loading}>
					保存
				</Button>
				<Button size="sm" variant="ghost" onClick={cancel}>
					キャンセル
				</Button>
			</div>
		</div>
	);

	return (
		<div className="flex flex-col gap-3">
			{mode === "idle" && (
				<div className="flex justify-end">
					<Button size="sm" onClick={startAdd}>
						<Plus className="mr-1 size-4" />
						追加
					</Button>
				</div>
			)}
			{mode === "add" && form}
			{records.length === 0 && mode === "idle" ? (
				<p className="rounded-lg border p-10 text-center text-sm text-muted-foreground">
					控除記録がありません。
				</p>
			) : (
				<div className="divide-y rounded-lg border">
					{records.map((r) =>
						mode === r.id ? (
							<div key={r.id} className="p-3">
								{form}
							</div>
						) : (
							<div key={r.id} className="flex items-center justify-between gap-4 px-4 py-3">
								<div className="min-w-0 flex-1">
									<p className="truncate text-sm font-medium">{name(r.relief_code)}</p>
									<p className="text-xs text-muted-foreground">
										{r.receipt_date}
										{r.description ? ` - ${r.description}` : ""}
									</p>
								</div>
								<p className="text-sm font-semibold whitespace-nowrap">
									RM {r.amount.toLocaleString()}
								</p>
								<div className="flex gap-1">
									<Button
										size="icon"
										variant="ghost"
										className="size-7"
										onClick={() => startEdit(r)}
										title="編集"
									>
										<Pencil className="size-3.5" />
									</Button>
									<Button
										size="icon"
										variant="ghost"
										className="size-7 text-destructive"
										onClick={() => handleDelete(r.id)}
										title="削除"
										disabled={loading}
									>
										<Trash2 className="size-3.5" />
									</Button>
								</div>
							</div>
						),
					)}
				</div>
			)}
		</div>
	);
}
