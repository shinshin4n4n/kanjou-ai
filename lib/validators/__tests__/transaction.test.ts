import { describe, expect, it } from "vitest";
import {
	aiClassifyRequestSchema,
	createTransactionSchema,
	updateTransactionSchema,
} from "@/lib/validators/transaction";

describe("createTransactionSchema", () => {
	// 正常系
	it("有効な取引データを受け入れる", () => {
		const input = {
			transactionDate: "2026-03-01",
			description: "AWS利用料",
			amount: 5000,
			debitAccount: "EXP001",
			creditAccount: "AST002",
			taxCategory: "tax_10",
			memo: "3月分",
		};
		const result = createTransactionSchema.safeParse(input);
		expect(result.success).toBe(true);
	});

	it("任意フィールドなしでも受け入れる", () => {
		const input = {
			transactionDate: "2026-01-15",
			description: "電車代",
			amount: 330,
			debitAccount: "EXP003",
			creditAccount: "AST001",
		};
		const result = createTransactionSchema.safeParse(input);
		expect(result.success).toBe(true);
	});

	it("descriptionの前後空白をトリムする", () => {
		const input = {
			transactionDate: "2026-01-15",
			description: "  電車代  ",
			amount: 330,
			debitAccount: "EXP003",
			creditAccount: "AST001",
		};
		const result = createTransactionSchema.safeParse(input);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.description).toBe("電車代");
		}
	});

	// 異常系
	it("不正な日付形式を拒否する", () => {
		const input = {
			transactionDate: "2026/03/01",
			description: "テスト",
			amount: 1000,
			debitAccount: "EXP001",
			creditAccount: "AST002",
		};
		const result = createTransactionSchema.safeParse(input);
		expect(result.success).toBe(false);
	});

	it("負の金額を拒否する", () => {
		const input = {
			transactionDate: "2026-03-01",
			description: "テスト",
			amount: -500,
			debitAccount: "EXP001",
			creditAccount: "AST002",
		};
		const result = createTransactionSchema.safeParse(input);
		expect(result.success).toBe(false);
	});

	it("無効な勘定科目コードを拒否する", () => {
		const input = {
			transactionDate: "2026-03-01",
			description: "テスト",
			amount: 1000,
			debitAccount: "INVALID_CODE",
			creditAccount: "AST002",
		};
		const result = createTransactionSchema.safeParse(input);
		expect(result.success).toBe(false);
	});

	it("空の摘要を拒否する", () => {
		const input = {
			transactionDate: "2026-03-01",
			description: "",
			amount: 1000,
			debitAccount: "EXP001",
			creditAccount: "AST002",
		};
		const result = createTransactionSchema.safeParse(input);
		expect(result.success).toBe(false);
	});
});

describe("updateTransactionSchema", () => {
	it("IDと部分更新を受け入れる", () => {
		const input = {
			id: "550e8400-e29b-41d4-a716-446655440000",
			isConfirmed: true,
		};
		const result = updateTransactionSchema.safeParse(input);
		expect(result.success).toBe(true);
	});

	it("無効なUUID形式のIDを拒否する", () => {
		const input = {
			id: "not-a-uuid",
			isConfirmed: true,
		};
		const result = updateTransactionSchema.safeParse(input);
		expect(result.success).toBe(false);
	});
});

describe("aiClassifyRequestSchema", () => {
	it("1〜50件の取引リクエストを受け入れる", () => {
		const input = {
			transactions: [{ date: "2026-03-01", description: "AWS", amount: 5000 }],
		};
		const result = aiClassifyRequestSchema.safeParse(input);
		expect(result.success).toBe(true);
	});

	it("空の取引配列を拒否する", () => {
		const input = { transactions: [] };
		const result = aiClassifyRequestSchema.safeParse(input);
		expect(result.success).toBe(false);
	});

	it("51件以上の取引を拒否する", () => {
		const transactions = Array.from({ length: 51 }, (_, i) => ({
			date: "2026-03-01",
			description: `取引${i}`,
			amount: 1000,
		}));
		const input = { transactions };
		const result = aiClassifyRequestSchema.safeParse(input);
		expect(result.success).toBe(false);
	});
});
