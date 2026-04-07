import { describe, expect, it } from "vitest";
import {
	type AssessmentYear,
	buildTaxReliefSummary,
	getTaxReliefLimit,
	getTaxReliefsByYear,
	TAX_RELIEF_CATEGORIES,
	TAX_RELIEF_LIMITS,
	type TaxReliefCode,
} from "@/lib/utils/tax-reliefs";

describe("TAX_RELIEF_CATEGORIES", () => {
	it("should contain all expected relief categories", () => {
		const codes = Object.keys(TAX_RELIEF_CATEGORIES);
		expect(codes).toContain("TR001");
		expect(codes).toContain("TR002");
		expect(codes.length).toBeGreaterThanOrEqual(10);
	});

	it("each category should have name and category fields", () => {
		for (const [_code, cat] of Object.entries(TAX_RELIEF_CATEGORIES)) {
			expect(cat.name).toBeTruthy();
			expect(typeof cat.name).toBe("string");
			expect(cat.category).toBeTruthy();
			expect(typeof cat.category).toBe("string");
		}
	});

	it("TR001 should be Individual and Dependent Relatives", () => {
		expect(TAX_RELIEF_CATEGORIES.TR001.name).toBe("Individual and Dependent Relatives");
		expect(TAX_RELIEF_CATEGORIES.TR001.category).toBe("personal");
	});

	it("TR002 should be EPF / Voluntary Contribution", () => {
		expect(TAX_RELIEF_CATEGORIES.TR002.name).toBe("EPF / Voluntary Contribution");
		expect(TAX_RELIEF_CATEGORIES.TR002.category).toBe("retirement");
	});
});

describe("TAX_RELIEF_LIMITS", () => {
	it("should have limits for YA 2024 and YA 2025", () => {
		expect(TAX_RELIEF_LIMITS["2024"]).toBeDefined();
		expect(TAX_RELIEF_LIMITS["2025"]).toBeDefined();
	});

	it("YA 2024 TR001 (Individual) should have limit of 9000", () => {
		expect(TAX_RELIEF_LIMITS["2024"].TR001).toBe(9000);
	});

	it("YA 2025 TR001 (Individual) should have limit of 9000", () => {
		expect(TAX_RELIEF_LIMITS["2025"].TR001).toBe(9000);
	});

	it("YA 2024 TR002 (EPF) should have limit of 4000", () => {
		expect(TAX_RELIEF_LIMITS["2024"].TR002).toBe(4000);
	});

	it("all limits should be positive integers", () => {
		for (const [_ya, limits] of Object.entries(TAX_RELIEF_LIMITS)) {
			for (const [_code, limit] of Object.entries(limits)) {
				expect(limit).toBeGreaterThan(0);
				expect(Number.isInteger(limit)).toBe(true);
			}
		}
	});

	it("every category code in limits should exist in TAX_RELIEF_CATEGORIES", () => {
		for (const [_ya, limits] of Object.entries(TAX_RELIEF_LIMITS)) {
			for (const code of Object.keys(limits)) {
				expect(TAX_RELIEF_CATEGORIES[code as TaxReliefCode]).toBeDefined();
			}
		}
	});
});

describe("getTaxReliefLimit", () => {
	it("returns the correct limit for a valid code and year", () => {
		expect(getTaxReliefLimit("TR001", "2024")).toBe(9000);
	});

	it("returns 0 for an invalid code", () => {
		expect(getTaxReliefLimit("INVALID" as TaxReliefCode, "2024")).toBe(0);
	});

	it("returns 0 for an invalid year", () => {
		expect(getTaxReliefLimit("TR001", "2020" as AssessmentYear)).toBe(0);
	});
});

describe("getTaxReliefsByYear", () => {
	it("returns all relief items with limits for the given year", () => {
		const items = getTaxReliefsByYear("2024");
		expect(items.length).toBeGreaterThanOrEqual(10);

		const tr001 = items.find((item) => item.code === "TR001");
		expect(tr001).toBeDefined();
		expect(tr001?.name).toBe("Individual and Dependent Relatives");
		expect(tr001?.limit).toBe(9000);
		expect(tr001?.category).toBe("personal");
	});

	it("returns empty array for an invalid year", () => {
		const items = getTaxReliefsByYear("2020" as AssessmentYear);
		expect(items).toEqual([]);
	});
});

describe("buildTaxReliefSummary", () => {
	const mkRecord = (code: string, amount: number) => ({
		id: `id-${code}-${amount}`,
		user_id: "u1",
		relief_code: code,
		assessment_year: "2024",
		amount,
		receipt_date: "2024-06-01",
		description: null,
		deleted_at: null,
		created_at: "2024-01-01T00:00:00Z",
		updated_at: "2024-01-01T00:00:00Z",
	});

	it("空の記録配列から全控除項目のサマリーを生成する（使用額0）", () => {
		const summary = buildTaxReliefSummary([], "2024");
		expect(summary.length).toBe(Object.keys(TAX_RELIEF_CATEGORIES).length);
		expect(summary.every((s) => s.used === 0)).toBe(true);
		expect(summary.every((s) => s.percentage === 0)).toBe(true);
		expect(summary.every((s) => !s.exceeded)).toBe(true);
	});

	it("同一控除コードの複数記録を合算する", () => {
		const records = [mkRecord("TR001", 3000), mkRecord("TR001", 4000)];
		const summary = buildTaxReliefSummary(records, "2024");
		const tr001 = summary.find((s) => s.code === "TR001");
		expect(tr001?.used).toBe(7000);
		expect(tr001?.limit).toBe(9000);
		expect(tr001?.percentage).toBeCloseTo(77.78, 0);
		expect(tr001?.exceeded).toBe(false);
	});

	it("上限額を超過した場合にexceeded=trueとなる", () => {
		const records = [mkRecord("TR003", 400)];
		const summary = buildTaxReliefSummary(records, "2024");
		const tr003 = summary.find((s) => s.code === "TR003");
		expect(tr003?.used).toBe(400);
		expect(tr003?.limit).toBe(350);
		expect(tr003?.exceeded).toBe(true);
		expect(tr003?.percentage).toBe(100);
	});

	it("上限額ちょうどの場合にexceeded=falseとなる", () => {
		const records = [mkRecord("TR003", 350)];
		const summary = buildTaxReliefSummary(records, "2024");
		const tr003 = summary.find((s) => s.code === "TR003");
		expect(tr003?.exceeded).toBe(false);
		expect(tr003?.percentage).toBe(100);
	});

	it("totalClaimableは上限額以下に切り詰めた合計を返す", () => {
		const records = [mkRecord("TR001", 20000), mkRecord("TR003", 500)];
		const summary = buildTaxReliefSummary(records, "2024");
		const tr001 = summary.find((s) => s.code === "TR001");
		const tr003 = summary.find((s) => s.code === "TR003");
		// TR001: used=20000 but claimable=9000 (limit)
		expect(tr001?.claimable).toBe(9000);
		// TR003: used=500 but claimable=350 (limit)
		expect(tr003?.claimable).toBe(350);
	});

	it("YA 2025でも正しく動作する", () => {
		const records = [{ ...mkRecord("TR001", 5000), assessment_year: "2025" }];
		const summary = buildTaxReliefSummary(records, "2025");
		const tr001 = summary.find((s) => s.code === "TR001");
		expect(tr001?.used).toBe(5000);
		expect(tr001?.limit).toBe(9000);
	});
});
