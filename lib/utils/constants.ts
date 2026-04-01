/**
 * 勘定科目・税区分の定数定義
 * Malaysia Form B（個人所得税申告書）対応
 */

export const ACCOUNT_CATEGORIES = {
	// Income (Form B)
	INC001: { name: "IT Services (Domestic)", type: "income", taxDefault: "not_applicable" },
	INC002: { name: "IT Services (Overseas)", type: "income", taxDefault: "not_applicable" },
	INC003: { name: "Software Licenses/Royalties", type: "income", taxDefault: "not_applicable" },
	INC004: { name: "Salary/Director Fee", type: "income", taxDefault: "not_applicable" },
	INC005: { name: "Interest Income", type: "income", taxDefault: "not_applicable" },
	INC006: { name: "Dividend Income", type: "income", taxDefault: "tax_exempt" },
	INC007: { name: "Rental Income", type: "income", taxDefault: "not_applicable" },
	// Expense (Section 33)
	EXP001: { name: "Software/Cloud/SaaS", type: "expense", taxDefault: "not_applicable" },
	EXP002: { name: "Telecommunication", type: "expense", taxDefault: "not_applicable" },
	EXP003: { name: "Office Rent", type: "expense", taxDefault: "not_applicable" },
	EXP004: { name: "Utilities", type: "expense", taxDefault: "not_applicable" },
	EXP005: { name: "Travel (Business)", type: "expense", taxDefault: "not_applicable" },
	EXP006: { name: "Professional Fees", type: "expense", taxDefault: "not_applicable" },
	EXP007: { name: "Training/Upskilling", type: "expense", taxDefault: "not_applicable" },
	EXP008: {
		name: "Entertainment",
		type: "expense",
		taxDefault: "not_applicable",
		deductionLimit: 0.5,
	},
	EXP009: { name: "Insurance (Business)", type: "expense", taxDefault: "not_applicable" },
	EXP010: { name: "Office Supplies", type: "expense", taxDefault: "not_applicable" },
	EXP011: { name: "Depreciation", type: "expense", taxDefault: "not_applicable" },
	EXP012: { name: "Marketing/Advertising", type: "expense", taxDefault: "not_applicable" },
	EXP013: { name: "Miscellaneous Expense", type: "expense", taxDefault: "not_applicable" },
	// Capital Expenditure (Schedule 3)
	CAP001: {
		name: "ICT Equipment",
		type: "capital",
		taxDefault: "not_applicable",
		capitalAllowance: { ia: 0.4, aa: 0.2 },
	},
	CAP002: {
		name: "Small Assets (<RM2000)",
		type: "capital",
		taxDefault: "not_applicable",
		capitalAllowance: { ia: 1.0, aa: 0 },
	},
	CAP003: {
		name: "Furniture/Fittings",
		type: "capital",
		taxDefault: "not_applicable",
		capitalAllowance: { ia: 0.1, aa: 0.1 },
	},
	CAP004: {
		name: "Motor Vehicle",
		type: "capital",
		taxDefault: "not_applicable",
		capitalAllowance: { ia: 0.2, aa: 0.2 },
	},
	CAP005: {
		name: "Software License (Capital)",
		type: "capital",
		taxDefault: "not_applicable",
		capitalAllowance: { ia: 0.2, aa: 0.1 },
	},
	// Asset
	AST001: { name: "Cash", type: "asset", taxDefault: "not_applicable" },
	AST002: { name: "Bank Account", type: "asset", taxDefault: "not_applicable" },
	AST003: { name: "Accounts Receivable", type: "asset", taxDefault: "not_applicable" },
	AST004: { name: "Owner's Drawings", type: "asset", taxDefault: "not_applicable" },
	// Liability
	LIA001: { name: "Accounts Payable", type: "liability", taxDefault: "not_applicable" },
	LIA002: { name: "Owner's Capital Injection", type: "liability", taxDefault: "not_applicable" },
} as const;

export type AccountCode = keyof typeof ACCOUNT_CATEGORIES;
export type AccountType = "expense" | "income" | "asset" | "liability" | "capital";

export const TAX_CATEGORIES = {
	tax_10: { name: "課税仕入10%", rate: 0.1 },
	tax_8: { name: "課税仕入8%（軽減税率）", rate: 0.08 },
	non_taxable: { name: "非課税", rate: 0 },
	not_applicable: { name: "不課税", rate: 0 },
	tax_exempt: { name: "免税", rate: 0 },
} as const;

export type TaxCategory = keyof typeof TAX_CATEGORIES;

export const AI_CONFIDENCE = {
	HIGH: 0.8,
	MEDIUM: 0.5,
	LOW: 0.3,
} as const;

export const UPLOAD_LIMITS = {
	MAX_FILE_SIZE: 5 * 1024 * 1024,
	ALLOWED_CSV_TYPES: ["text/csv", "application/vnd.ms-excel"],
	MAX_ROWS_PER_IMPORT: 2500,
} as const;

export const CURRENCY_SYMBOLS: Record<string, string> = {
	JPY: "¥",
	MYR: "RM",
	USD: "$",
	EUR: "€",
	GBP: "£",
	SGD: "S$",
};

export const RATE_LIMITS = {
	AI_CLASSIFY_PER_MINUTE: 10,
	CSV_IMPORT_PER_HOUR: 5,
} as const;
