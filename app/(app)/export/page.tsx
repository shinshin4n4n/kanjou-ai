"use client";

import { Download } from "lucide-react";
import { useState } from "react";
import { exportTransactions } from "@/app/_actions/export-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { ExportRequestInput } from "@/lib/validators/transaction";

const VALID_FORMATS = ["yayoi", "freee", "generic"] as const;

const FORMAT_LABELS: Record<ExportRequestInput["format"], string> = {
	yayoi: "弥生",
	freee: "freee",
	generic: "汎用CSV",
};

function isExportFormat(value: string): value is ExportRequestInput["format"] {
	return (VALID_FORMATS as readonly string[]).includes(value);
}

export default function ExportPage() {
	const today = new Date().toISOString().slice(0, 10);
	const yearStart = `${today.slice(0, 4)}-01-01`;

	const [format, setFormat] = useState<ExportRequestInput["format"]>("yayoi");
	const [startDate, setStartDate] = useState(yearStart);
	const [endDate, setEndDate] = useState(today);
	const [confirmedOnly, setConfirmedOnly] = useState(true);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function handleExport() {
		setIsLoading(true);
		setError(null);

		try {
			const result = await exportTransactions({ format, startDate, endDate, confirmedOnly });

			if (result.success) {
				const blob = new Blob([result.data.csv], { type: "text/csv;charset=utf-8" });
				const url = URL.createObjectURL(blob);
				const a = document.createElement("a");
				a.href = url;
				a.download = `kanjou-${format}-${startDate}-${endDate}.csv`;
				a.click();
				URL.revokeObjectURL(url);
			} else {
				setError(result.error);
			}
		} catch {
			setError("エクスポート中にエラーが発生しました。");
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<div className="p-6">
			<Card className="max-w-lg mx-auto">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Download className="size-5" />
						CSVエクスポート
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="format">出力形式</Label>
						<Select
							value={format}
							onValueChange={(v) => {
								if (isExportFormat(v)) setFormat(v);
							}}
						>
							<SelectTrigger id="format">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{VALID_FORMATS.map((f) => (
									<SelectItem key={f} value={f}>
										{FORMAT_LABELS[f]}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="startDate">開始日</Label>
							<Input
								id="startDate"
								type="date"
								value={startDate}
								onChange={(e) => setStartDate(e.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="endDate">終了日</Label>
							<Input
								id="endDate"
								type="date"
								value={endDate}
								onChange={(e) => setEndDate(e.target.value)}
							/>
						</div>
					</div>
					<div className="flex items-center gap-2">
						<input
							id="confirmedOnly"
							type="checkbox"
							checked={confirmedOnly}
							onChange={(e) => setConfirmedOnly(e.target.checked)}
							className="size-4 rounded border-gray-300"
						/>
						<Label htmlFor="confirmedOnly">確認済みデータのみ</Label>
					</div>

					{error && <p className="text-sm text-destructive">{error}</p>}

					<Button onClick={handleExport} disabled={isLoading} className="w-full">
						{isLoading ? "エクスポート中..." : "ダウンロード"}
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
