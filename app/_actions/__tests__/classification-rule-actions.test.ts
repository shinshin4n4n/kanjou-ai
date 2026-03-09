import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
	requireAuth: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
	createClient: vi.fn(),
}));

vi.mock("next/cache", () => ({
	revalidatePath: vi.fn(),
}));

import {
	deleteClassificationRule,
	getClassificationRules,
	saveClassificationRule,
} from "@/app/_actions/classification-rule-actions";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const mockRequireAuth = vi.mocked(requireAuth);
const mockCreateClient = vi.mocked(createClient);

const RULE_UUID = "550e8400-e29b-41d4-a716-446655440000";

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

function createSelectChain(
	data: unknown[] | null,
	error: { code: string; message: string } | null = null,
) {
	const mock: Record<string, ReturnType<typeof vi.fn>> = {};
	for (const method of ["select", "eq", "order"]) {
		mock[method] = vi.fn().mockReturnValue(mock);
	}
	mock.limit = vi.fn().mockResolvedValue({ data, error });
	const mockFrom = vi.fn().mockReturnValue(mock);

	mockCreateClient.mockResolvedValue({
		from: mockFrom,
	} as unknown as Awaited<ReturnType<typeof createClient>>);

	return { mock, mockFrom };
}

function createInsertChain(
	data: unknown | null,
	error: { code: string; message: string } | null = null,
	existingCount = 0,
) {
	// count query chain: select("id", { count, head }) → eq("user_id") → resolves { count }
	const countChain: Record<string, ReturnType<typeof vi.fn>> = {};
	countChain.select = vi.fn().mockReturnValue(countChain);
	countChain.eq = vi.fn().mockResolvedValue({ count: existingCount, error: null });

	// insert chain: insert → select → single → resolves { data, error }
	const insertChain: Record<string, ReturnType<typeof vi.fn>> = {};
	for (const method of ["insert", "select"]) {
		insertChain[method] = vi.fn().mockReturnValue(insertChain);
	}
	insertChain.single = vi.fn().mockResolvedValue({ data, error });

	let callCount = 0;
	const mockFrom = vi.fn().mockImplementation(() => {
		callCount++;
		return callCount === 1 ? countChain : insertChain;
	});

	mockCreateClient.mockResolvedValue({
		from: mockFrom,
	} as unknown as Awaited<ReturnType<typeof createClient>>);

	return { mock: insertChain, mockFrom };
}

function createDeleteChain(error: { code: string; message: string } | null = null) {
	const mock: Record<string, ReturnType<typeof vi.fn>> = {};
	mock.delete = vi.fn().mockReturnValue(mock);
	mock.eq = vi.fn();
	// delete → eq("id") → eq("user_id") chain
	const eqResults = [
		{ error }, // second eq resolves
	];
	let eqCallCount = 0;
	mock.eq = vi.fn().mockImplementation(() => {
		eqCallCount++;
		if (eqCallCount >= 2) {
			return Promise.resolve(eqResults[0]);
		}
		return mock;
	});
	const mockFrom = vi.fn().mockReturnValue(mock);

	mockCreateClient.mockResolvedValue({
		from: mockFrom,
	} as unknown as Awaited<ReturnType<typeof createClient>>);

	return { mock, mockFrom };
}

const sampleRule = {
	id: RULE_UUID,
	user_id: "user-123",
	instruction: "AWSの利用料は通信費にしてください",
	created_at: "2026-03-01T00:00:00Z",
};

describe("getClassificationRules", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("正常取得: ルール一覧を返す", async () => {
		mockAuthSuccess();
		createSelectChain([sampleRule]);

		const result = await getClassificationRules();

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data).toHaveLength(1);
			expect(result.data[0]!.instruction).toBe("AWSの利用料は通信費にしてください");
		}
	});

	it("認証エラー時にUNAUTHORIZEDを返す", async () => {
		mockAuthFailure();

		const result = await getClassificationRules();

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.code).toBe("UNAUTHORIZED");
		}
	});

	it("DBエラー時にエラー詳細を漏洩しない", async () => {
		mockAuthSuccess();
		createSelectChain(null, { code: "42501", message: "RLS violation secret" });

		const result = await getClassificationRules();

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error).not.toContain("secret");
			expect(result.error).not.toContain("RLS");
		}
	});
});

describe("saveClassificationRule", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("正常保存: 新しいルールを返す", async () => {
		mockAuthSuccess();
		createInsertChain(sampleRule);

		const result = await saveClassificationRule("AWSの利用料は通信費にしてください");

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.instruction).toBe("AWSの利用料は通信費にしてください");
		}
	});

	it("認証エラー時にUNAUTHORIZEDを返す", async () => {
		mockAuthFailure();

		const result = await saveClassificationRule("テスト");

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.code).toBe("UNAUTHORIZED");
		}
	});

	it("空文字列でバリデーションエラーを返す", async () => {
		mockAuthSuccess();

		const result = await saveClassificationRule("");

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.code).toBe("VALIDATION_ERROR");
		}
	});

	it("500文字超でバリデーションエラーを返す", async () => {
		mockAuthSuccess();

		const result = await saveClassificationRule("あ".repeat(501));

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.code).toBe("VALIDATION_ERROR");
		}
	});

	it("DBエラー時にエラー詳細を漏洩しない", async () => {
		mockAuthSuccess();
		createInsertChain(null, { code: "23505", message: "duplicate key secret" });

		const result = await saveClassificationRule("テスト");

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error).not.toContain("secret");
			expect(result.error).not.toContain("duplicate");
		}
	});

	it("上限20件超過でバリデーションエラーを返す", async () => {
		mockAuthSuccess();
		createInsertChain(null, null, 20);

		const result = await saveClassificationRule("新しいルール");

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.code).toBe("VALIDATION_ERROR");
			expect(result.error).toContain("20");
		}
	});
});

describe("deleteClassificationRule", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("正常削除: 成功を返す", async () => {
		mockAuthSuccess();
		createDeleteChain();

		const result = await deleteClassificationRule(RULE_UUID);

		expect(result.success).toBe(true);
	});

	it("認証エラー時にUNAUTHORIZEDを返す", async () => {
		mockAuthFailure();

		const result = await deleteClassificationRule(RULE_UUID);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.code).toBe("UNAUTHORIZED");
		}
	});

	it("無効なUUIDでバリデーションエラーを返す", async () => {
		mockAuthSuccess();

		const result = await deleteClassificationRule("not-a-uuid");

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.code).toBe("VALIDATION_ERROR");
		}
	});

	it("DBエラー時にエラー詳細を漏洩しない", async () => {
		mockAuthSuccess();
		createDeleteChain({ code: "42501", message: "RLS violation secret" });

		const result = await deleteClassificationRule(RULE_UUID);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error).not.toContain("secret");
		}
	});
});
