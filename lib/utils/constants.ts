/**
 * 勘定科目・税区分の定数定義
 * フリーランスIT向けのプリセット
 */

export const ACCOUNT_CATEGORIES = {
	EXP001: { name: "通信費", type: "expense", taxDefault: "tax_10" },
	EXP002: { name: "消耗品費", type: "expense", taxDefault: "tax_10" },
	EXP003: { name: "旅費交通費", type: "expense", taxDefault: "tax_10" },
	EXP004: { name: "地代家賃", type: "expense", taxDefault: "tax_10" },
	EXP005: { name: "水道光熱費", type: "expense", taxDefault: "tax_10" },
	EXP006: { name: "新聞図書費", type: "expense", taxDefault: "tax_10" },
	EXP007: { name: "支払手数料", type: "expense", taxDefault: "tax_10" },
	EXP008: { name: "外注費", type: "expense", taxDefault: "tax_10" },
	EXP009: { name: "接待交際費", type: "expense", taxDefault: "tax_10" },
	EXP010: { name: "雑費", type: "expense", taxDefault: "tax_10" },
	EXP011: { name: "減価償却費", type: "expense", taxDefault: "not_applicable" },
	EXP012: { name: "広告宣伝費", type: "expense", taxDefault: "tax_10" },
	EXP013: { name: "租税公課", type: "expense", taxDefault: "not_applicable" },
	INC001: { name: "売上高", type: "income", taxDefault: "tax_10" },
	INC002: { name: "雑収入", type: "income", taxDefault: "tax_10" },
	AST001: { name: "現金", type: "asset", taxDefault: "not_applicable" },
	AST002: { name: "普通預金", type: "asset", taxDefault: "not_applicable" },
	AST003: { name: "売掛金", type: "asset", taxDefault: "not_applicable" },
	AST004: { name: "事業主貸", type: "asset", taxDefault: "not_applicable" },
	LIA001: { name: "未払金", type: "liability", taxDefault: "not_applicable" },
	LIA002: { name: "事業主借", type: "liability", taxDefault: "not_applicable" },
} as const;

export type AccountCode = keyof typeof ACCOUNT_CATEGORIES;
export type AccountType = "expense" | "income" | "asset" | "liability";

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
	MAX_ROWS_PER_IMPORT: 1000,
} as const;

export const RATE_LIMITS = {
	AI_CLASSIFY_PER_MINUTE: 10,
	CSV_IMPORT_PER_HOUR: 5,
} as const;
