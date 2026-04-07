import { describe, expect, it } from "vitest";
import {
	TAX_RELIEF_CATEGORIES,
	TAX_RELIEF_LIMITS,
	type TaxReliefCode,
	type AssessmentYear,
	getTaxReliefLimit,
	getTaxReliefsByYear,
} from "@/lib/utils/tax-reliefs";

describe("TAX_RELIEF_CATEGORIES", () => {
	it("should contain all expected relief categories", () => {
		const codes = Object.keys(TAX_RELIEF_CATEGORIES);
		expect(codes).toContain("TR001");
		expect(codes).toContain("TR002");
		expect(codes.length).toBeGreaterThanOrEqual(10);
	});

	it("each category should have name and category fields", () => {
		for (const [code, cat] of Object.entries(TAX_RELIEF_CATEGORIES)) {
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
		for (const [ya, limits] of Object.entries(TAX_RELIEF_LIMITS)) {
			for (const [code, limit] of Object.entries(limits)) {
				expect(limit).toBeGreaterThan(0);
				expect(Number.isInteger(limit)).toBe(true);
			}
		}
	});

	it("every category code in limits should exist in TAX_RELIEF_CATEGORIES", () => {
		for (const [ya, limits] of Object.entries(TAX_RELIEF_LIMITS)) {
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
