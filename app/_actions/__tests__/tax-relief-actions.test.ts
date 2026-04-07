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
	createTaxRelief,
	deleteTaxRelief,
	getTaxReliefs,
	updateTaxRelief,
} from "@/app/_actions/tax-relief-actions";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const mockRequireAuth = vi.mocked(requireAuth);
const mockCreateClient = vi.mocked(createClient);

const RECORD_UUID = "550e8400-e29b-41d4-a716-446655440000";

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
	for (const method of ["select", "eq", "is", "order"]) {
		mock[method] = vi.fn().mockReturnValue(mock);
	}
	// final method in chain resolves
	mock.order = vi.fn().mockResolvedValue({ data, error });
	const mockFrom = vi.fn().mockReturnValue(mock);
	mockCreateClient.mockResolvedValue({
		from: mockFrom,
	} as unknown as Awaited<ReturnType<typeof createClient>>);
	return { mock, mockFrom };
}

function createInsertChain(
	data: unknown | null,
	error: { code: string; message: string } | null = null,
) {
	const mock: Record<string, ReturnType<typeof vi.fn>> = {};
	for (const method of ["insert", "select"]) {
		mock[method] = vi.fn().mockReturnValue(mock);
	}
	mock.single = vi.fn().mockResolvedValue({ data, error });
	const mockFrom = vi.fn().mockReturnValue(mock);
	mockCreateClient.mockResolvedValue({
		from: mockFrom,
	} as unknown as Awaited<ReturnType<typeof createClient>>);
	return { mock, mockFrom };
}

function createUpdateChain(
	data: unknown | null,
	error: { code: string; message: string } | null = null,
) {
	const mock: Record<string, ReturnType<typeof vi.fn>> = {};
	for (const method of ["update", "eq", "select"]) {
		mock[method] = vi.fn().mockReturnValue(mock);
	}
	mock.single = vi.fn().mockResolvedValue({ data, error });
	const mockFrom = vi.fn().mockReturnValue(mock);
	mockCreateClient.mockResolvedValue({
		from: mockFrom,
	} as unknown as Awaited<ReturnType<typeof createClient>>);
	return { mock, mockFrom };
}

function createDeleteChain(error: { code: string; message: string } | null = null) {
	const mock: Record<string, ReturnType<typeof vi.fn>> = {};
	mock.update = vi.fn().mockReturnValue(mock);
	let eqCallCount = 0;
	mock.eq = vi.fn().mockImplementation(() => {
		eqCallCount++;
		if (eqCallCount >= 2) return Promise.resolve({ error });
		return mock;
	});
	const mockFrom = vi.fn().mockReturnValue(mock);
	mockCreateClient.mockResolvedValue({
		from: mockFrom,
	} as unknown as Awaited<ReturnType<typeof createClient>>);
	return { mock, mockFrom };
}

const sampleRecord = {
	id: RECORD_UUID,
	user_id: "user-123",
	relief_code: "TR001",
	assessment_year: "2024",
	amount: 5000,
	receipt_date: "2024-06-15",
	description: "EPF contribution",
	created_at: "2024-06-15T00:00:00Z",
	updated_at: "2024-06-15T00:00:00Z",
	deleted_at: null,
};

describe("getTaxReliefs", () => {
	beforeEach(() => vi.clearAllMocks());

	it("正常取得: 控除記録一覧を返す", async () => {
		mockAuthSuccess();
		createSelectChain([sampleRecord]);
		const result = await getTaxReliefs({ assessment_year: "2024" });
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data).toHaveLength(1);
			expect(result.data[0]?.relief_code).toBe("TR001");
		}
	});

	it("認証エラー時にUNAUTHORIZEDを返す", async () => {
		mockAuthFailure();
		const result = await getTaxReliefs({ assessment_year: "2024" });
		expect(result.success).toBe(false);
		if (!result.success) expect(result.code).toBe("UNAUTHORIZED");
	});

	it("無効な年度でバリデーションエラーを返す", async () => {
		mockAuthSuccess();
		const result = await getTaxReliefs({ assessment_year: "2020" as never });
		expect(result.success).toBe(false);
		if (!result.success) expect(result.code).toBe("VALIDATION_ERROR");
	});

	it("DBエラー時にエラー詳細を漏洩しない", async () => {
		mockAuthSuccess();
		createSelectChain(null, { code: "42501", message: "RLS violation secret" });
		const result = await getTaxReliefs({ assessment_year: "2024" });
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error).not.toContain("secret");
		}
	});
});

describe("createTaxRelief", () => {
	beforeEach(() => vi.clearAllMocks());

	it("正常作成: 新しい控除記録を返す", async () => {
		mockAuthSuccess();
		createInsertChain(sampleRecord);
		const result = await createTaxRelief({
			relief_code: "TR001",
			assessment_year: "2024",
			amount: 5000,
			receipt_date: "2024-06-15",
			description: "EPF contribution",
		});
		expect(result.success).toBe(true);
		if (result.success) expect(result.data.relief_code).toBe("TR001");
	});

	it("認証エラー時にUNAUTHORIZEDを返す", async () => {
		mockAuthFailure();
		const result = await createTaxRelief({
			relief_code: "TR001",
			assessment_year: "2024",
			amount: 5000,
			receipt_date: "2024-06-15",
		});
		expect(result.success).toBe(false);
		if (!result.success) expect(result.code).toBe("UNAUTHORIZED");
	});

	it("負の金額でバリデーションエラーを返す", async () => {
		mockAuthSuccess();
		const result = await createTaxRelief({
			relief_code: "TR001",
			assessment_year: "2024",
			amount: -100,
			receipt_date: "2024-06-15",
		});
		expect(result.success).toBe(false);
		if (!result.success) expect(result.code).toBe("VALIDATION_ERROR");
	});

	it("DBエラー時にエラー詳細を漏洩しない", async () => {
		mockAuthSuccess();
		createInsertChain(null, { code: "23505", message: "duplicate key secret" });
		const result = await createTaxRelief({
			relief_code: "TR001",
			assessment_year: "2024",
			amount: 5000,
			receipt_date: "2024-06-15",
		});
		expect(result.success).toBe(false);
		if (!result.success) expect(result.error).not.toContain("secret");
	});
});

describe("updateTaxRelief", () => {
	beforeEach(() => vi.clearAllMocks());

	it("正常更新: 更新された控除記録を返す", async () => {
		mockAuthSuccess();
		createUpdateChain({ ...sampleRecord, amount: 3000 });
		const result = await updateTaxRelief({ id: RECORD_UUID, amount: 3000 });
		expect(result.success).toBe(true);
		if (result.success) expect(result.data.amount).toBe(3000);
	});

	it("認証エラー時にUNAUTHORIZEDを返す", async () => {
		mockAuthFailure();
		const result = await updateTaxRelief({ id: RECORD_UUID, amount: 3000 });
		expect(result.success).toBe(false);
		if (!result.success) expect(result.code).toBe("UNAUTHORIZED");
	});

	it("無効なUUIDでバリデーションエラーを返す", async () => {
		mockAuthSuccess();
		const result = await updateTaxRelief({ id: "not-uuid", amount: 3000 });
		expect(result.success).toBe(false);
		if (!result.success) expect(result.code).toBe("VALIDATION_ERROR");
	});

	it("DBエラー時にエラー詳細を漏洩しない", async () => {
		mockAuthSuccess();
		createUpdateChain(null, { code: "42501", message: "RLS secret" });
		const result = await updateTaxRelief({ id: RECORD_UUID, amount: 3000 });
		expect(result.success).toBe(false);
		if (!result.success) expect(result.error).not.toContain("secret");
	});
});

describe("deleteTaxRelief", () => {
	beforeEach(() => vi.clearAllMocks());

	it("正常削除（論理削除）: 成功を返す", async () => {
		mockAuthSuccess();
		createDeleteChain();
		const result = await deleteTaxRelief(RECORD_UUID);
		expect(result.success).toBe(true);
	});

	it("認証エラー時にUNAUTHORIZEDを返す", async () => {
		mockAuthFailure();
		const result = await deleteTaxRelief(RECORD_UUID);
		expect(result.success).toBe(false);
		if (!result.success) expect(result.code).toBe("UNAUTHORIZED");
	});

	it("無効なUUIDでバリデーションエラーを返す", async () => {
		mockAuthSuccess();
		const result = await deleteTaxRelief("not-uuid");
		expect(result.success).toBe(false);
		if (!result.success) expect(result.code).toBe("VALIDATION_ERROR");
	});

	it("DBエラー時にエラー詳細を漏洩しない", async () => {
		mockAuthSuccess();
		createDeleteChain({ code: "42501", message: "RLS secret" });
		const result = await deleteTaxRelief(RECORD_UUID);
		expect(result.success).toBe(false);
		if (!result.success) expect(result.error).not.toContain("secret");
	});
});
