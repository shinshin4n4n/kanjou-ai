"use client";

import { useEffect, useState } from "react";
import { getProfile, updateProfile } from "@/app/_actions/profile";
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

	if (loading) return <p style={{ margin: 40 }}>読み込み中...</p>;

	return (
		<div style={{ maxWidth: 400, margin: "40px auto", padding: "0 16px" }}>
			<h1 style={{ fontSize: 24, marginBottom: 24 }}>設定</h1>

			<form action={handleSubmit}>
				<div style={{ marginBottom: 12 }}>
					<label htmlFor="displayName">表示名</label>
					<br />
					<input
						id="displayName"
						name="displayName"
						type="text"
						value={displayName}
						onChange={(e) => setDisplayName(e.target.value)}
						maxLength={50}
						style={{ width: "100%", padding: 8, marginTop: 4 }}
					/>
				</div>

				<div style={{ marginBottom: 12 }}>
					<label htmlFor="fiscalYearStart">会計年度開始月</label>
					<br />
					<select
						id="fiscalYearStart"
						name="fiscalYearStart"
						value={fiscalYearStart}
						onChange={(e) => setFiscalYearStart(e.target.value)}
						style={{ width: "100%", padding: 8, marginTop: 4 }}
					>
						{Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
							<option key={month} value={month}>
								{month}月
							</option>
						))}
					</select>
				</div>

				<div style={{ marginBottom: 12 }}>
					<label htmlFor="defaultTaxRate">デフォルト税区分</label>
					<br />
					<select
						id="defaultTaxRate"
						name="defaultTaxRate"
						value={defaultTaxRate}
						onChange={(e) => setDefaultTaxRate(e.target.value)}
						style={{ width: "100%", padding: 8, marginTop: 4 }}
					>
						{Object.entries(TAX_CATEGORIES).map(([key, { name }]) => (
							<option key={key} value={key}>
								{name}
							</option>
						))}
					</select>
				</div>

				{message && <p style={{ color: "green", marginBottom: 12 }}>{message}</p>}
				{error && <p style={{ color: "red", marginBottom: 12 }}>{error}</p>}

				<button type="submit" style={{ width: "100%", padding: 10 }}>
					保存
				</button>
			</form>
		</div>
	);
}
