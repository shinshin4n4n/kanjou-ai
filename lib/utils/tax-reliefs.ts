/**
 * Malaysia Tax Reliefs (個人控除) 定数定義
 * LHDN Tax Reliefs for YA 2024 / YA 2025
 * Issue #154
 */

export const TAX_RELIEF_CATEGORIES = {
	TR001: { name: "Individual and Dependent Relatives", category: "personal" },
	TR002: { name: "EPF / Voluntary Contribution", category: "retirement" },
	TR003: { name: "SOCSO / EIS Contribution", category: "retirement" },
	TR004: { name: "Life Insurance / Takaful", category: "insurance" },
	TR005: { name: "Education / Medical Insurance", category: "insurance" },
	TR006: { name: "Private Retirement Scheme (PRS)", category: "retirement" },
	TR007: { name: "Education Fees (Self)", category: "education" },
	TR008: { name: "Medical Expenses (Parents)", category: "medical" },
	TR009: { name: "Medical Expenses (Self / Spouse / Child)", category: "medical" },
	TR010: { name: "Lifestyle (Books, Electronics, etc.)", category: "lifestyle" },
	TR011: { name: "Lifestyle (Sports & Fitness)", category: "lifestyle" },
	TR012: { name: "Child Relief (Under 18)", category: "family" },
	TR013: { name: "Child Relief (18+ in Higher Education)", category: "family" },
	TR014: { name: "Disabled Individual (Self)", category: "disability" },
	TR015: { name: "Disabled Spouse", category: "disability" },
	TR016: { name: "Spouse / Alimony", category: "personal" },
	TR017: { name: "Domestic Travel", category: "lifestyle" },
	TR018: { name: "EV Charging Facilities", category: "lifestyle" },
} as const;

export type TaxReliefCode = keyof typeof TAX_RELIEF_CATEGORIES;
export type TaxReliefCategory = (typeof TAX_RELIEF_CATEGORIES)[TaxReliefCode]["category"];

export const ASSESSMENT_YEARS = ["2024", "2025"] as const;
export type AssessmentYear = (typeof ASSESSMENT_YEARS)[number];

/**
 * YA別の控除上限額 (RM)
 * Source: LHDN official tax relief tables
 */
export const TAX_RELIEF_LIMITS: Record<AssessmentYear, Record<TaxReliefCode, number>> = {
	"2024": {
		TR001: 9000,
		TR002: 4000,
		TR003: 350,
		TR004: 3000,
		TR005: 3000,
		TR006: 3000,
		TR007: 7000,
		TR008: 8000,
		TR009: 10000,
		TR010: 2500,
		TR011: 500,
		TR012: 2000,
		TR013: 8000,
		TR014: 6000,
		TR015: 5000,
		TR016: 4000,
		TR017: 1000,
		TR018: 2500,
	},
	"2025": {
		TR001: 9000,
		TR002: 4000,
		TR003: 350,
		TR004: 3000,
		TR005: 3000,
		TR006: 3000,
		TR007: 7000,
		TR008: 8000,
		TR009: 10000,
		TR010: 2500,
		TR011: 500,
		TR012: 2000,
		TR013: 8000,
		TR014: 6000,
		TR015: 5000,
		TR016: 4000,
		TR017: 1000,
		TR018: 2500,
	},
} as const;

export type TaxReliefItem = {
	code: TaxReliefCode;
	name: string;
	category: string;
	limit: number;
};

export type TaxReliefSummaryItem = TaxReliefItem & {
	used: number;
	claimable: number;
	percentage: number;
	exceeded: boolean;
};

/**
 * 指定コード・年度の控除上限額を取得
 * 無効なコード/年度の場合は 0 を返す
 */
export function getTaxReliefLimit(code: TaxReliefCode, year: AssessmentYear): number {
	return TAX_RELIEF_LIMITS[year]?.[code] ?? 0;
}

/**
 * 控除記録を集計し、各項目のサマリーを生成する
 */
export function buildTaxReliefSummary(
	records: { relief_code: string; amount: number }[],
	year: AssessmentYear,
): TaxReliefSummaryItem[] {
	const usedMap = new Map<string, number>();
	for (const r of records) {
		usedMap.set(r.relief_code, (usedMap.get(r.relief_code) ?? 0) + r.amount);
	}

	return getTaxReliefsByYear(year).map((item) => {
		const used = usedMap.get(item.code) ?? 0;
		const exceeded = used > item.limit;
		const claimable = Math.min(used, item.limit);
		const percentage = item.limit > 0 ? Math.min((used / item.limit) * 100, 100) : 0;
		return { ...item, used, claimable, percentage, exceeded };
	});
}

/**
 * 指定年度の全控除項目をリストで返す
 * 無効な年度の場合は空配列を返す
 */
export function getTaxReliefsByYear(year: AssessmentYear): TaxReliefItem[] {
	const limits = TAX_RELIEF_LIMITS[year];
	if (!limits) return [];

	return Object.entries(TAX_RELIEF_CATEGORIES).map(([code, cat]) => ({
		code: code as TaxReliefCode,
		name: cat.name,
		category: cat.category,
		limit: limits[code as TaxReliefCode],
	}));
}
