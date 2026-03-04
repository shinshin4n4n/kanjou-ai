import { describe, expect, it } from "vitest";
import {
	createClassificationRuleSchema,
	deleteClassificationRuleSchema,
} from "../classification-rule";

describe("createClassificationRuleSchema", () => {
	it("有効な指示テキストでパースが成功する", () => {
		const result = createClassificationRuleSchema.safeParse({
			instruction: "AWSの利用料は通信費にしてください",
		});
		expect(result.success).toBe(true);
	});

	it("空文字列でバリデーションエラーになる", () => {
		const result = createClassificationRuleSchema.safeParse({
			instruction: "",
		});
		expect(result.success).toBe(false);
	});

	it("空白のみでバリデーションエラーになる", () => {
		const result = createClassificationRuleSchema.safeParse({
			instruction: "   ",
		});
		expect(result.success).toBe(false);
	});

	it("500文字超でバリデーションエラーになる", () => {
		const result = createClassificationRuleSchema.safeParse({
			instruction: "あ".repeat(501),
		});
		expect(result.success).toBe(false);
	});

	it("500文字ちょうどでパースが成功する", () => {
		const result = createClassificationRuleSchema.safeParse({
			instruction: "あ".repeat(500),
		});
		expect(result.success).toBe(true);
	});

	it("前後の空白をトリムする", () => {
		const result = createClassificationRuleSchema.safeParse({
			instruction: "  AWSは通信費  ",
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.instruction).toBe("AWSは通信費");
		}
	});
});

describe("deleteClassificationRuleSchema", () => {
	it("有効なUUIDでパースが成功する", () => {
		const result = deleteClassificationRuleSchema.safeParse({
			id: "550e8400-e29b-41d4-a716-446655440000",
		});
		expect(result.success).toBe(true);
	});

	it("無効なUUIDでバリデーションエラーになる", () => {
		const result = deleteClassificationRuleSchema.safeParse({
			id: "not-a-uuid",
		});
		expect(result.success).toBe(false);
	});
});
