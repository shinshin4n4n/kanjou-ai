import { describe, expect, it } from "vitest";
import {
	createTaxReliefSchema,
	updateTaxReliefSchema,
	deleteTaxReliefSchema,
	getTaxReliefsSchema,
} from "@/lib/validators/tax-relief";

const validInput = {
	relief_code: "TR001",
	assessment_year: "2024",
	amount: 5000,
	receipt_date: "2024-06-15",
	description: "EPF contribution",
};

describe("createTaxReliefSchema", () => {
	it("有効な入力を受け付ける", () => {
		const result = createTaxReliefSchema.safeParse(validInput);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.relief_code).toBe("TR001");
			expect(result.data.amount).toBe(5000);
		}
	});

	it("descriptionなしでも有効", () => {
		const { description: _, ...input } = validInput;
		const result = createTaxReliefSchema.safeParse(input);
		expect(result.success).toBe(true);
	});

	it("無効なrelief_codeを拒否", () => {
		const result = createTaxReliefSchema.safeParse({ ...validInput, relief_code: "INVALID" });
		expect(result.success).toBe(false);
	});

	it("無効なassessment_yearを拒否", () => {
		const result = createTaxReliefSchema.safeParse({ ...validInput, assessment_year: "2023" });
		expect(result.success).toBe(false);
	});

	it("負の金額を拒否", () => {
		const result = createTaxReliefSchema.safeParse({ ...validInput, amount: -100 });
		expect(result.success).toBe(false);
	});

	it("0の金額を拒否", () => {
		const result = createTaxReliefSchema.safeParse({ ...validInput, amount: 0 });
		expect(result.success).toBe(false);
	});

	it("無効な日付形式を拒否", () => {
		const result = createTaxReliefSchema.safeParse({ ...validInput, receipt_date: "2024/06/15" });
		expect(result.success).toBe(false);
	});

	it("descriptionが500文字超で拒否", () => {
		const result = createTaxReliefSchema.safeParse({ ...validInput, description: "あ".repeat(501) });
		expect(result.success).toBe(false);
	});

	it("descriptionの前後空白をトリムする", () => {
		const result = createTaxReliefSchema.safeParse({ ...validInput, description: "  test  " });
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.description).toBe("test");
		}
	});
});

describe("updateTaxReliefSchema", () => {
	it("idと更新フィールドを受け付ける", () => {
		const result = updateTaxReliefSchema.safeParse({
			id: "550e8400-e29b-41d4-a716-446655440000",
			amount: 3000,
		});
		expect(result.success).toBe(true);
	});

	it("無効なUUID idを拒否", () => {
		const result = updateTaxReliefSchema.safeParse({ id: "not-uuid", amount: 3000 });
		expect(result.success).toBe(false);
	});

	it("更新フィールドなし（idのみ）でも有効", () => {
		const result = updateTaxReliefSchema.safeParse({
			id: "550e8400-e29b-41d4-a716-446655440000",
		});
		expect(result.success).toBe(true);
	});

	it("負の金額を拒否", () => {
		const result = updateTaxReliefSchema.safeParse({
			id: "550e8400-e29b-41d4-a716-446655440000",
			amount: -1,
		});
		expect(result.success).toBe(false);
	});
});

describe("deleteTaxReliefSchema", () => {
	it("有効なUUIDを受け付ける", () => {
		const result = deleteTaxReliefSchema.safeParse({ id: "550e8400-e29b-41d4-a716-446655440000" });
		expect(result.success).toBe(true);
	});

	it("無効なUUIDを拒否", () => {
		const result = deleteTaxReliefSchema.safeParse({ id: "invalid" });
		expect(result.success).toBe(false);
	});
});

describe("getTaxReliefsSchema", () => {
	it("有効なassessment_yearを受け付ける", () => {
		const result = getTaxReliefsSchema.safeParse({ assessment_year: "2024" });
		expect(result.success).toBe(true);
	});

	it("無効なassessment_yearを拒否", () => {
		const result = getTaxReliefsSchema.safeParse({ assessment_year: "2020" });
		expect(result.success).toBe(false);
	});
});
