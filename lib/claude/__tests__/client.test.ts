import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockCreate } = vi.hoisted(() => ({
	mockCreate: vi.fn(),
}));

vi.mock("@anthropic-ai/sdk", () => {
	class MockAnthropic {
		messages = { create: mockCreate };
	}
	return { default: MockAnthropic };
});

import { classifyTransactions } from "@/lib/claude/client";
import type { TransactionInput } from "@/lib/claude/types";

const UUID_1 = "550e8400-e29b-41d4-a716-446655440000";
const UUID_2 = "550e8400-e29b-41d4-a716-446655440001";

/** プリフィル「{」を考慮し、先頭の { を除いた文字列を返す */
function withoutLeadingBrace(obj: unknown): string {
	return JSON.stringify(obj).slice(1);
}

const sampleInput: TransactionInput[] = [
	{
		id: UUID_1,
		date: "2026-01-15",
		description: "AWS利用料",
		amount: 5000,
	},
];

const validApiResponse = {
	content: [
		{
			type: "text",
			text: withoutLeadingBrace({
				classifications: [
					{
						id: UUID_1,
						debitAccount: "EXP001",
						creditAccount: "AST002",
						confidence: "HIGH",
						reason: "クラウドサービス利用料は通信費に該当",
					},
				],
			}),
		},
	],
	stop_reason: "end_turn",
};

describe("classifyTransactions", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("単一取引の仕訳を推定できる", async () => {
		mockCreate.mockResolvedValue(validApiResponse);

		const result = await classifyTransactions(sampleInput);

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data).toHaveLength(1);
			expect(result.data[0]!.debitAccount).toBe("EXP001");
			expect(result.data[0]!.creditAccount).toBe("AST002");
			expect(result.data[0]!.confidence).toBe("HIGH");
			expect(result.data[0]!.reason).toBeTruthy();
		}
	});

	it("複数取引を一括で推定できる", async () => {
		const multiInput: TransactionInput[] = [
			{ id: UUID_1, date: "2026-01-15", description: "AWS利用料", amount: 5000 },
			{ id: UUID_2, date: "2026-01-16", description: "電車代", amount: 500 },
		];
		mockCreate.mockResolvedValue({
			content: [
				{
					type: "text",
					text: withoutLeadingBrace({
						classifications: [
							{
								id: UUID_1,
								debitAccount: "EXP001",
								creditAccount: "AST002",
								confidence: "HIGH",
								reason: "クラウドサービス",
							},
							{
								id: UUID_2,
								debitAccount: "EXP003",
								creditAccount: "AST001",
								confidence: "HIGH",
								reason: "交通費",
							},
						],
					}),
				},
			],
			stop_reason: "end_turn",
		});

		const result = await classifyTransactions(multiInput);

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data).toHaveLength(2);
			expect(result.data[0]!.debitAccount).toBe("EXP001");
			expect(result.data[1]!.debitAccount).toBe("EXP003");
		}
	});

	it("messages.create にシステムプロンプトが含まれる", async () => {
		mockCreate.mockResolvedValue(validApiResponse);

		await classifyTransactions(sampleInput);

		expect(mockCreate).toHaveBeenCalledWith(
			expect.objectContaining({
				system: expect.stringContaining("勘定科目"),
			}),
		);
	});

	it("APIエラー時にAI_ERRORを返す", async () => {
		mockCreate.mockRejectedValue(new Error("API connection failed"));

		const result = await classifyTransactions(sampleInput);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.code).toBe("AI_ERROR");
			expect(result.error).not.toContain("API connection failed");
		}
	});

	it("レート制限エラー(429)時に適切なメッセージを返す", async () => {
		const rateLimitError = new Error("rate limit");
		Object.assign(rateLimitError, { status: 429 });
		mockCreate.mockRejectedValue(rateLimitError);

		const result = await classifyTransactions(sampleInput);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.code).toBe("RATE_LIMIT");
		}
	});

	it("不正なAPIレスポンスでエラーを返す", async () => {
		mockCreate.mockResolvedValue({
			content: [{ type: "text", text: "これはJSONではありません" }],
			stop_reason: "end_turn",
		});

		const result = await classifyTransactions(sampleInput);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.code).toBe("AI_ERROR");
		}
	});

	it("空の取引配列でバリデーションエラーを返す", async () => {
		const result = await classifyTransactions([]);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.code).toBe("VALIDATION_ERROR");
		}
	});

	it("50件超の取引でバリデーションエラーを返す", async () => {
		const manyInputs: TransactionInput[] = Array.from({ length: 51 }, (_, i) => ({
			date: "2026-01-15",
			description: `取引${i}`,
			amount: 1000,
		}));

		const result = await classifyTransactions(manyInputs);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.code).toBe("VALIDATION_ERROR");
		}
	});

	it("マークダウンコードブロック付きJSONをパースできる", async () => {
		const jsonContent = withoutLeadingBrace({
			classifications: [
				{
					id: UUID_1,
					debitAccount: "EXP001",
					creditAccount: "AST002",
					confidence: "HIGH",
					reason: "通信費",
				},
			],
		});
		mockCreate.mockResolvedValue({
			content: [{ type: "text", text: `\`\`\`json\n${jsonContent}\n\`\`\`` }],
			stop_reason: "end_turn",
		});

		const result = await classifyTransactions(sampleInput);

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data).toHaveLength(1);
			expect(result.data[0]!.debitAccount).toBe("EXP001");
		}
	});

	it("ユーザー指示がプロンプトに含まれる", async () => {
		mockCreate.mockResolvedValue(validApiResponse);

		await classifyTransactions(sampleInput, "AWSは通信費にしてください");

		expect(mockCreate).toHaveBeenCalledWith(
			expect.objectContaining({
				messages: expect.arrayContaining([
					expect.objectContaining({
						role: "user",
						content: expect.stringContaining("AWSは通信費にしてください"),
					}),
				]),
			}),
		);
	});

	it("ユーザー指示なしで従来通り動作する", async () => {
		mockCreate.mockResolvedValue(validApiResponse);

		await classifyTransactions(sampleInput);

		expect(mockCreate).toHaveBeenCalledWith(
			expect.objectContaining({
				messages: expect.arrayContaining([
					expect.objectContaining({
						role: "user",
						content: expect.not.stringContaining("ユーザー指示"),
					}),
				]),
			}),
		);
	});

	it("エラー詳細を漏洩しない", async () => {
		mockCreate.mockRejectedValue(new Error("secret internal error details"));

		const result = await classifyTransactions(sampleInput);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error).not.toContain("secret");
			expect(result.error).not.toContain("internal");
		}
	});
});
