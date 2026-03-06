import type { AccountCode, TaxCategory } from "@/lib/utils/constants";
import { ACCOUNT_CATEGORIES, TAX_CATEGORIES } from "@/lib/utils/constants";

export type ExportFormat = "yayoi" | "freee" | "generic";

export type ExportTransaction = {
	transaction_date: string;
	description: string;
	amount: number;
	debit_account: string;
	credit_account: string;
	tax_category: string | null;
};

export function escapeCsvField(value: string): string {
	if (value.includes(",") || value.includes('"') || value.includes("\n")) {
		return `"${value.replace(/"/g, '""')}"`;
	}
	return value;
}

function accountName(code: string): string {
	const cat = ACCOUNT_CATEGORIES[code as AccountCode];
	return cat ? cat.name : code;
}

function taxName(category: string | null): string {
	if (!category) return "";
	const tax = TAX_CATEGORIES[category as TaxCategory];
	return tax ? tax.name : "";
}

function row(fields: (string | number)[]): string {
	return fields.map((f) => (typeof f === "number" ? String(f) : escapeCsvField(f))).join(",");
}

export function formatYayoi(transactions: ExportTransaction[]): string {
	const header = "仕訳日付,借方勘定科目,借方金額,貸方勘定科目,貸方金額,摘要";
	const rows = transactions.map((tx) =>
		row([
			tx.transaction_date,
			accountName(tx.debit_account),
			tx.amount,
			accountName(tx.credit_account),
			tx.amount,
			tx.description,
		]),
	);
	return [header, ...rows].join("\n");
}

export function formatFreee(transactions: ExportTransaction[]): string {
	const header = "日付,借方勘定科目,借方金額,貸方勘定科目,貸方金額,摘要,税区分";
	const rows = transactions.map((tx) =>
		row([
			tx.transaction_date,
			accountName(tx.debit_account),
			tx.amount,
			accountName(tx.credit_account),
			tx.amount,
			tx.description,
			taxName(tx.tax_category),
		]),
	);
	return [header, ...rows].join("\n");
}

export function formatGeneric(transactions: ExportTransaction[]): string {
	const header = "日付,摘要,借方科目,借方金額,貸方科目,貸方金額";
	const rows = transactions.map((tx) =>
		row([
			tx.transaction_date,
			tx.description,
			accountName(tx.debit_account),
			tx.amount,
			accountName(tx.credit_account),
			tx.amount,
		]),
	);
	return [header, ...rows].join("\n");
}

const formatters: Record<ExportFormat, (txs: ExportTransaction[]) => string> = {
	yayoi: formatYayoi,
	freee: formatFreee,
	generic: formatGeneric,
};

export function formatTransactions(
	format: ExportFormat,
	transactions: ExportTransaction[],
): string {
	return `\uFEFF${formatters[format](transactions)}`;
}
