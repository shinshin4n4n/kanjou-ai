import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
	requireAuth: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
	createClient: vi.fn(),
}));

vi.mock("@/lib/claude/client", () => ({
	classifyTransactions: vi.fn(),
}));

vi.mock("next/cache", () => ({
	revalidatePath: vi.fn(),
}));

import { revalidatePath } from "next/cache";
import { runAiClassification } from "@/app/_actions/ai-classify-actions";
import { requireAuth } from "@/lib/auth";
import { classifyTransactions } from "@/lib/claude/client";
import { createClient } from "@/lib/supabase/server";

const mockRequireAuth = vi.mocked(requireAuth);
const mockCreateClient = vi.mocked(createClient);
const mockClassify = vi.mocked(classifyTransactions);
const mockRevalidatePath = vi.mocked(revalidatePath);

const UUID_1 = "550e8400-e29b-41d4-a716-446655440000";
const UUID_2 = "550e8400-e29b-41d4-a716-446655440001";

function mockAuthSuccess() {
	mockRequireAuth.mockResolvedValue({
		success: true,
		data: { id: "user-123" } as never,
	});
}

function mockAuthFailure() {
	mockRequireAuth.mockResolvedValue({
		success: false,
		error: "ログインが必要です。",
		code: "UNAUTHORIZED",
	});
}

function createSelectMock(
	data: unknown[] | null,
	error: { code: string; message: string } | null = null,
) {
	const mock: Record<string, ReturnType<typeof vi.fn>> = {};
	for (const method of ["select", "eq", "update"]) {
		mock[method] = vi.fn().mockReturnValue(mock);
	}
	mock.in = vi.fn().mockResolvedValue({ data, error });
	const mockFrom = vi.fn().mockReturnValue(mock);

	mockCreateClient.mockResolvedValue({
		from: mockFrom,
	} as unknown as Awaited<ReturnType<typeof createClient>>);

	return { mock, mockFrom };
}

function createSelectAndUpdateMock(
	selectData: unknown[],
	_updateData: unknown[] | null = null,
	updateError: { code: string; message: string } | null = null,
) {
	const updateChain: Record<string, ReturnType<typeof vi.fn>> = {};
	updateChain.update = vi.fn().mockReturnValue(updateChain);
	updateChain.eq = vi.fn().mockResolvedValue({ error: updateError });

	const selectChain: Record<string, ReturnType<typeof vi.fn>> = {};
	selectChain.select = vi.fn().mockReturnValue(selectChain);
	selectChain.in = vi.fn().mockResolvedValue({ data: selectData, error: null });

	let callCount = 0;
	const mockFrom = vi.fn().mockImplementation(() => {
		callCount++;
		if (callCount === 1) return selectChain;
		return updateChain;
	});

	mockCreateClient.mockResolvedValue({
		from: mockFrom,
	} as unknown as Awaited<ReturnType<typeof createClient>>);

	return { mockFrom, selectChain, updateChain };
}

const dbTransaction1 = {
	id: UUID_1,
	transaction_date: "2026-01-15",
	description: "AWS利用料",
	amount: 5000,
	debit_account: "EXP001",
	credit_account: "AST002",
	is_confirmed: false,
	ai_suggested: false,
	user_id: "user-123",
};

const dbTransaction2 = {
	id: UUID_2,
	transaction_date: "2026-01-16",
	description: "電車代",
	amount: 500,
	debit_account: "EXP003",
	credit_account: "AST001",
	is_confirmed: false,
	ai_suggested: false,
	user_id: "user-123",
};

describe("runAiClassification", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("正常推定: AI分類結果を返しDBを更新する", async () => {
		mockAuthSuccess();
		const updatedTxs = [
			{
				...dbTransaction1,
				debit_account: "EXP001",
				credit_account: "AST002",
				ai_suggested: true,
				ai_confidence: 90,
			},
			{
				...dbTransaction2,
				debit_account: "EXP003",
				credit_account: "AST001",
				ai_suggested: true,
				ai_confidence: 90,
			},
		];
		createSelectAndUpdateMock([dbTransaction1, dbTransaction2], updatedTxs);
		mockClassify.mockResolvedValue({
			success: true,
			data: [
				{
					id: UUID_1,
					debitAccount: "EXP001",
					creditAccount: "AST002",
					confidence: "HIGH",
					reason: "クラウドサービス利用料",
				},
				{
					id: UUID_2,
					debitAccount: "EXP003",
					creditAccount: "AST001",
					confidence: "HIGH",
					reason: "交通費",
				},
			],
		});

		const result = await runAiClassification([UUID_1, UUID_2]);

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data).toHaveLength(2);
			expect(result.data[0].debitAccount).toBe("EXP001");
			expect(result.data[0].confidence).toBe("HIGH");
			expect(result.data[1].debitAccount).toBe("EXP003");
		}
	});

	it("AI APIエラー時にAI_ERRORを返す", async () => {
		mockAuthSuccess();
		createSelectMock([dbTransaction1]);
		mockClassify.mockResolvedValue({
			success: false,
			error: "AI仕訳推定に失敗しました。",
			code: "AI_ERROR",
		});

		const result = await runAiClassification([UUID_1]);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.code).toBe("AI_ERROR");
		}
	});

	it("認証エラー時にUNAUTHORIZEDを返す", async () => {
		mockAuthFailure();

		const result = await runAiClassification([UUID_1]);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.code).toBe("UNAUTHORIZED");
		}
	});

	it("空の配列でバリデーションエラーを返す", async () => {
		mockAuthSuccess();

		const result = await runAiClassification([]);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.code).toBe("VALIDATION_ERROR");
		}
	});

	it("50件超でバリデーションエラーを返す", async () => {
		mockAuthSuccess();
		const manyIds = Array.from(
			{ length: 51 },
			(_, i) => `550e8400-e29b-41d4-a716-${String(i).padStart(12, "0")}`,
		);

		const result = await runAiClassification(manyIds);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.code).toBe("VALIDATION_ERROR");
		}
	});

	it("DB更新エラー時にエラーを返す", async () => {
		mockAuthSuccess();
		createSelectAndUpdateMock([dbTransaction1], null, {
			code: "42501",
			message: "permission denied",
		});
		mockClassify.mockResolvedValue({
			success: true,
			data: [
				{
					id: UUID_1,
					debitAccount: "EXP001",
					creditAccount: "AST002",
					confidence: "HIGH",
					reason: "理由",
				},
			],
		});

		const result = await runAiClassification([UUID_1]);

		expect(result.success).toBe(false);
	});

	it("revalidatePathが呼ばれる", async () => {
		mockAuthSuccess();
		const updatedTx = { ...dbTransaction1, ai_suggested: true, ai_confidence: 90 };
		createSelectAndUpdateMock([dbTransaction1], [updatedTx]);
		mockClassify.mockResolvedValue({
			success: true,
			data: [
				{
					id: UUID_1,
					debitAccount: "EXP001",
					creditAccount: "AST002",
					confidence: "HIGH",
					reason: "理由",
				},
			],
		});

		await runAiClassification([UUID_1]);

		expect(mockRevalidatePath).toHaveBeenCalledWith("/transactions");
	});

	it("エラー詳細を漏洩しない", async () => {
		mockAuthSuccess();
		createSelectMock([dbTransaction1]);
		mockClassify.mockResolvedValue({
			success: false,
			error: "secret internal error details",
			code: "AI_ERROR",
		});

		const result = await runAiClassification([UUID_1]);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error).not.toContain("secret");
			expect(result.error).not.toContain("internal");
		}
	});
});
