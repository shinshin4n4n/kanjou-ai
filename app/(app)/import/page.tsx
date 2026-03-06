"use client";

import { CheckCircle, FileText, Upload } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { importTransactions } from "@/app/_actions/import-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { decodeShiftJis } from "@/lib/csv/decode";
import { type CsvFormat, type ParsedTransaction, parseCsv } from "@/lib/csv/parsers";
import { UPLOAD_LIMITS } from "@/lib/utils/constants";

type Phase = "upload" | "preview" | "result";

const FORMAT_LABELS: Record<CsvFormat, string> = {
	wise: "Wise",
	revolut: "Revolut",
	smbc: "三井住友カード",
	rakuten: "楽天カード",
	generic: "汎用CSV",
};

const PREVIEW_LIMIT = 20;

export default function ImportPage() {
	const [phase, setPhase] = useState<Phase>("upload");
	const [transactions, setTransactions] = useState<ParsedTransaction[]>([]);
	const [csvFormat, setCsvFormat] = useState<CsvFormat>("generic");
	const [fileName, setFileName] = useState("");
	const [fileSize, setFileSize] = useState(0);
	const [error, setError] = useState<string | null>(null);
	const [importedCount, setImportedCount] = useState(0);
	const [isLoading, setIsLoading] = useState(false);

	function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file) return;

		setError(null);

		if (!UPLOAD_LIMITS.ALLOWED_CSV_TYPES.includes(file.type) && !file.name.endsWith(".csv")) {
			setError("CSVファイルのみアップロードできます。");
			return;
		}

		if (file.size > UPLOAD_LIMITS.MAX_FILE_SIZE) {
			setError("ファイルサイズが5MBを超えています。");
			return;
		}

		setFileName(file.name);
		setFileSize(file.size);

		const reader = new FileReader();
		reader.onload = () => {
			const buffer = reader.result as ArrayBuffer;
			let csvText = new TextDecoder("utf-8").decode(buffer);
			let result = parseCsv(csvText);

			if (result.transactions.length === 0) {
				csvText = decodeShiftJis(buffer);
				result = parseCsv(csvText);
			}

			if (result.transactions.length === 0) {
				setError("CSVファイルから取引データを読み取れませんでした。");
				return;
			}

			if (result.transactions.length > UPLOAD_LIMITS.MAX_ROWS_PER_IMPORT) {
				setError(`取引件数が上限（${UPLOAD_LIMITS.MAX_ROWS_PER_IMPORT}件）を超えています。`);
				return;
			}

			setCsvFormat(result.format);
			setTransactions(result.transactions);
			setPhase("preview");
		};
		reader.readAsArrayBuffer(file);
	}

	async function handleImport() {
		setIsLoading(true);
		setError(null);

		try {
			const result = await importTransactions({
				transactions,
				fileName,
				fileSize,
				csvFormat,
			});

			if (result.success) {
				setImportedCount(result.data.importedCount);
				setPhase("result");
			} else {
				setError(result.error);
			}
		} catch {
			setError("インポート中にエラーが発生しました。");
		} finally {
			setIsLoading(false);
		}
	}

	function handleReset() {
		setPhase("upload");
		setTransactions([]);
		setError(null);
		setFileName("");
		setFileSize(0);
		setImportedCount(0);
	}

	if (phase === "result") {
		return (
			<div className="p-6">
				<Card className="max-w-lg mx-auto">
					<CardContent className="pt-6 text-center space-y-4">
						<CheckCircle className="size-12 mx-auto text-green-500" />
						<h2 className="text-xl font-bold">インポート完了</h2>
						<p className="text-muted-foreground">{importedCount}件の取引をインポートしました。</p>
						<div className="flex gap-2 justify-center">
							<Button asChild>
								<Link href="/transactions">取引一覧を見る</Link>
							</Button>
							<Button variant="outline" onClick={handleReset}>
								続けてインポート
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (phase === "preview") {
		const previewed = transactions.slice(0, PREVIEW_LIMIT);
		const remaining = transactions.length - PREVIEW_LIMIT;

		return (
			<div className="p-6 space-y-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<h1 className="text-xl font-bold">プレビュー</h1>
						<Badge variant="secondary">{FORMAT_LABELS[csvFormat]}</Badge>
						<span className="text-sm text-muted-foreground">{transactions.length}件</span>
					</div>
					<div className="flex gap-2">
						<Button variant="outline" onClick={handleReset}>
							キャンセル
						</Button>
						<Button onClick={handleImport} disabled={isLoading}>
							{isLoading ? "インポート中..." : "インポート実行"}
						</Button>
					</div>
				</div>

				{error && <p className="text-sm text-destructive">{error}</p>}

				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>日付</TableHead>
							<TableHead>摘要</TableHead>
							<TableHead className="text-right">金額</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{previewed.map((tx, i) => (
							<TableRow key={`${tx.date}-${tx.description}-${i}`}>
								<TableCell>{tx.date}</TableCell>
								<TableCell>{tx.description}</TableCell>
								<TableCell className="text-right">
									{Math.abs(tx.amount).toLocaleString()}円
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>

				{remaining > 0 && (
					<p className="text-sm text-muted-foreground text-center">他 {remaining} 件</p>
				)}
			</div>
		);
	}

	return (
		<div className="p-6">
			<Card className="max-w-lg mx-auto">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Upload className="size-5" />
						CSVインポート
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Input type="file" accept=".csv" onChange={handleFileSelect} />
						<p className="text-xs text-muted-foreground">
							<FileText className="inline size-3 mr-1" />
							CSV形式、最大5MB（Wise / Revolut / 三井住友カード / 楽天カード対応）
						</p>
					</div>
					{error && <p className="text-sm text-destructive">{error}</p>}
				</CardContent>
			</Card>
		</div>
	);
}
