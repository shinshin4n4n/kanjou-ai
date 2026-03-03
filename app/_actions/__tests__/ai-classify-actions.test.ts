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
import { applyAiClassifications, runAiClassification } from "@/app/_actions/ai-classify-actions";
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

function createUpdateMock(updateError: { code: string; message: string } | null = null) {
	const updateChain: Record<string, ReturnType<typeof vi.fn>> = {};
	updateChain.update = vi.fn().mockReturnValue(updateChain);
	updateChain.eq = vi.fn().mockResolvedValue({ error: updateError });

	const mockFrom = vi.fn().mockReturnValue(updateChain);

	mockCreateClient.mockResolvedValue({
		from: mockFrom,
	} as unknown as Awaited<ReturnType<typeof createClient>>);

	return { mockFrom, updateChain };
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

	it("正常推定: AI分類結果にdescriptionとamountを含めて返す", async () => {
		mockAuthSuccess();
		createSelectMock([dbTransaction1, dbTransaction2]);
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
			expect(result.data[0]).toMatchObject({
				id: UUID_1,
				description: "AWS利用料",
				amount: 5000,
				debitAccount: "EXP001",
				creditAccount: "AST002",
				confidence: "HIGH",
				reason: "クラウドサービス利用料",
			});
			expect(result.data[1]).toMatchObject({
				id: UUID_2,
				description: "電車代",
				amount: 500,
				debitAccount: "EXP003",
			});
		}
	});

	it("DBに保存しない（revalidatePathを呼ばない）", async () => {
		mockAuthSuccess();
		createSelectMock([dbTransaction1]);
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

		expect(mockRevalidatePath).not.toHaveBeenCalled();
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

describe("applyAiClassifications", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("正常適用: 分類結果をDBに保存しis_confirmedをtrueにする", async () => {
		mockAuthSuccess();
		const { updateChain } = createUpdateMock();

		const result = await applyAiClassifications([
			{ id: UUID_1, debitAccount: "EXP001", creditAccount: "AST002", confidence: "HIGH" },
		]);

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data).toBe(1);
		}
		expect(updateChain.update).toHaveBeenCalledWith(
			expect.objectContaining({
				debit_account: "EXP001",
				credit_account: "AST002",
				ai_suggested: true,
				is_confirmed: true,
			}),
		);
	});

	it("認証エラー時にUNAUTHORIZEDを返す", async () => {
		mockAuthFailure();

		const result = await applyAiClassifications([
			{ id: UUID_1, debitAccount: "EXP001", creditAccount: "AST002", confidence: "HIGH" },
		]);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.code).toBe("UNAUTHORIZED");
		}
	});

	it("空配列でバリデーションエラーを返す", async () => {
		mockAuthSuccess();

		const result = await applyAiClassifications([]);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.code).toBe("VALIDATION_ERROR");
		}
	});

	it("無効な勘定科目でバリデーションエラーを返す", async () => {
		mockAuthSuccess();

		const result = await applyAiClassifications([
			{ id: UUID_1, debitAccount: "INVALID", creditAccount: "AST002", confidence: "HIGH" },
		]);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.code).toBe("VALIDATION_ERROR");
		}
	});

	it("DB更新エラー時にエラーを返す", async () => {
		mockAuthSuccess();
		createUpdateMock({ code: "42501", message: "permission denied" });

		const result = await applyAiClassifications([
			{ id: UUID_1, debitAccount: "EXP001", creditAccount: "AST002", confidence: "HIGH" },
		]);

		expect(result.success).toBe(false);
	});

	it("適用後にrevalidatePathが呼ばれる", async () => {
		mockAuthSuccess();
		createUpdateMock();

		await applyAiClassifications([
			{ id: UUID_1, debitAccount: "EXP001", creditAccount: "AST002", confidence: "HIGH" },
		]);

		expect(mockRevalidatePath).toHaveBeenCalledWith("/transactions");
	});

	it("エラー詳細を漏洩しない", async () => {
		mockAuthSuccess();
		createUpdateMock({ code: "42501", message: "secret RLS violation details" });

		const result = await applyAiClassifications([
			{ id: UUID_1, debitAccount: "EXP001", creditAccount: "AST002", confidence: "HIGH" },
		]);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error).not.toContain("secret");
			expect(result.error).not.toContain("RLS");
		}
	});
});
