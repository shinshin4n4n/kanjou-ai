"use client";

import { useEffect, useState } from "react";
import { getProfile, updateProfile } from "@/app/_actions/profile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { TAX_CATEGORIES } from "@/lib/utils/constants";

export default function SettingsPage() {
	const [displayName, setDisplayName] = useState("");
	const [fiscalYearStart, setFiscalYearStart] = useState("1");
	const [defaultTaxRate, setDefaultTaxRate] = useState("tax_10");
	const [message, setMessage] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		getProfile().then((result) => {
			if (result.success) {
				setDisplayName(result.data.display_name ?? "");
				setFiscalYearStart(String(result.data.fiscal_year_start));
				setDefaultTaxRate(result.data.default_tax_rate);
			}
			setLoading(false);
		});
	}, []);

	async function handleSubmit(formData: FormData) {
		setMessage("");
		setError("");

		const result = await updateProfile(formData);

		if (result.success) {
			setMessage("保存しました。");
		} else {
			setError(result.error);
		}
	}

	if (loading) {
		return (
			<div className="flex items-center justify-center p-10">
				<p className="text-sm text-muted-foreground">読み込み中...</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-6 p-4 md:p-6">
			<div>
				<h1 className="text-xl font-bold tracking-tight">設定</h1>
				<p className="text-sm text-muted-foreground">プロフィールと会計設定</p>
			</div>

			<Card className="max-w-lg">
				<CardHeader>
					<CardTitle>プロフィール設定</CardTitle>
					<CardDescription>表示名と会計年度の設定を管理します。</CardDescription>
				</CardHeader>
				<CardContent>
					<form action={handleSubmit} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="displayName">表示名</Label>
							<Input
								id="displayName"
								name="displayName"
								type="text"
								value={displayName}
								onChange={(e) => setDisplayName(e.target.value)}
								maxLength={50}
								placeholder="表示名を入力"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="fiscalYearStart">会計年度開始月</Label>
							<Select
								name="fiscalYearStart"
								value={fiscalYearStart}
								onValueChange={setFiscalYearStart}
							>
								<SelectTrigger id="fiscalYearStart">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
										<SelectItem key={month} value={String(month)}>
											{month}月
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label htmlFor="defaultTaxRate">デフォルト税区分</Label>
							<Select
								name="defaultTaxRate"
								value={defaultTaxRate}
								onValueChange={setDefaultTaxRate}
							>
								<SelectTrigger id="defaultTaxRate">
									<SelectValue />
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

						{message && <p className="text-sm text-green-600">{message}</p>}
						{error && <p className="text-sm text-destructive">{error}</p>}

						<Button type="submit" className="w-full">
							保存
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
