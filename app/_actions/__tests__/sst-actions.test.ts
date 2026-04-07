import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
	requireAuth: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
	createClient: vi.fn(),
}));

import { getSstStatus } from "@/app/_actions/sst-actions";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const mockRequireAuth = vi.mocked(requireAuth);
const mockCreateClient = vi.mocked(createClient);

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

type IncomeRow = {
	credit_account: string;
	original_amount: number | null;
	original_currency: string | null;
	amount: number;
};

function createSupabaseMock(result: {
	data: IncomeRow[] | null;
	error: { code: string; message: string } | null;
}) {
	const chainMock: Record<string, ReturnType<typeof vi.fn>> = {};
	for (const method of ["select", "eq", "gte", "in", "is"]) {
		chainMock[method] = vi.fn().mockReturnValue(chainMock);
	}
	chainMock.is = vi.fn().mockResolvedValue(result);

	const mockFrom = vi.fn().mockReturnValue(chainMock);
	mockCreateClient.mockResolvedValue({
		from: mockFrom,
	} as unknown as Awaited<ReturnType<typeof createClient>>);

	return { chainMock, mockFrom };
}

describe("getSstStatus", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-04-07"));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("12ヶ月累計の課税・非課税売上が正しく計算される", async () => {
		mockAuthSuccess();
		createSupabaseMock({
			data: [
				{
					credit_account: "INC001",
					original_amount: 200000,
					original_currency: "MYR",
					amount: 6000000,
				},
				{
					credit_account: "INC001",
					original_amount: 150000,
					original_currency: "MYR",
					amount: 4500000,
				},
				{
					credit_account: "INC002",
					original_amount: 100000,
					original_currency: "MYR",
					amount: 3000000,
				},
			],
			error: null,
		});

		const result = await getSstStatus();

		expect(result.success).toBe(true);
		if (!result.success) return;
		expect(result.data.taxableTotal).toBe(350000);
		expect(result.data.nonTaxableTotal).toBe(100000);
		expect(result.data.alertLevel).toBe("none");
	});

	it("累計RM40万超で黄色警告", async () => {
		mockAuthSuccess();
		createSupabaseMock({
			data: [
				{
					credit_account: "INC001",
					original_amount: 410000,
					original_currency: "MYR",
					amount: 12300000,
				},
			],
			error: null,
		});

		const result = await getSstStatus();

		expect(result.success).toBe(true);
		if (!result.success) return;
		expect(result.data.taxableTotal).toBe(410000);
		expect(result.data.alertLevel).toBe("yellow");
	});

	it("累計RM48万超で赤色警告", async () => {
		mockAuthSuccess();
		createSupabaseMock({
			data: [
				{
					credit_account: "INC001",
					original_amount: 490000,
					original_currency: "MYR",
					amount: 14700000,
				},
			],
			error: null,
		});

		const result = await getSstStatus();

		expect(result.success).toBe(true);
		if (!result.success) return;
		expect(result.data.taxableTotal).toBe(490000);
		expect(result.data.alertLevel).toBe("red");
	});

	it("累計RM50万超で登録必須", async () => {
		mockAuthSuccess();
		createSupabaseMock({
			data: [
				{
					credit_account: "INC001",
					original_amount: 510000,
					original_currency: "MYR",
					amount: 15300000,
				},
			],
			error: null,
		});

		const result = await getSstStatus();

		expect(result.success).toBe(true);
		if (!result.success) return;
		expect(result.data.taxableTotal).toBe(510000);
		expect(result.data.alertLevel).toBe("red");
		expect(result.data.registrationRequired).toBe(true);
	});

	it("取引データがない場合は全て0・alertLevel none", async () => {
		mockAuthSuccess();
		createSupabaseMock({ data: [], error: null });

		const result = await getSstStatus();

		expect(result.success).toBe(true);
		if (!result.success) return;
		expect(result.data.taxableTotal).toBe(0);
		expect(result.data.nonTaxableTotal).toBe(0);
		expect(result.data.alertLevel).toBe("none");
		expect(result.data.registrationRequired).toBe(false);
	});

	it("閾値ちょうど（RM400,000）は警告なし", async () => {
		mockAuthSuccess();
		createSupabaseMock({
			data: [
				{
					credit_account: "INC001",
					original_amount: 400000,
					original_currency: "MYR",
					amount: 12000000,
				},
			],
			error: null,
		});

		const result = await getSstStatus();

		expect(result.success).toBe(true);
		if (!result.success) return;
		expect(result.data.taxableTotal).toBe(400000);
		expect(result.data.alertLevel).toBe("none");
	});

	it("閾値ちょうど（RM500,000）は登録不要（超過で義務）", async () => {
		mockAuthSuccess();
		createSupabaseMock({
			data: [
				{
					credit_account: "INC001",
					original_amount: 500000,
					original_currency: "MYR",
					amount: 15000000,
				},
			],
			error: null,
		});

		const result = await getSstStatus();

		expect(result.success).toBe(true);
		if (!result.success) return;
		expect(result.data.taxableTotal).toBe(500000);
		expect(result.data.registrationRequired).toBe(false);
		expect(result.data.alertLevel).toBe("red");
	});

	it("original_amountがnullの場合amountにフォールバック", async () => {
		mockAuthSuccess();
		createSupabaseMock({
			data: [
				{
					credit_account: "INC001",
					original_amount: null,
					original_currency: null,
					amount: 450000,
				},
			],
			error: null,
		});

		const result = await getSstStatus();

		expect(result.success).toBe(true);
		if (!result.success) return;
		expect(result.data.taxableTotal).toBe(450000);
		expect(result.data.alertLevel).toBe("yellow");
	});

	it("未認証の場合UNAUTHORIZEDエラーを返す", async () => {
		mockAuthFailure();

		const result = await getSstStatus();

		expect(result.success).toBe(false);
		if (result.success) return;
		expect(result.code).toBe("UNAUTHORIZED");
	});

	it("DBエラー時にINTERNAL_ERRORを返す", async () => {
		mockAuthSuccess();
		createSupabaseMock({
			data: null,
			error: { code: "42P01", message: "relation does not exist" },
		});

		const result = await getSstStatus();

		expect(result.success).toBe(false);
		if (result.success) return;
		expect(result.code).toBe("INTERNAL_ERROR");
	});

	it("INC001とINC002以外の収入はカウントしない", async () => {
		mockAuthSuccess();
		createSupabaseMock({
			data: [
				{
					credit_account: "INC001",
					original_amount: 100000,
					original_currency: "MYR",
					amount: 3000000,
				},
				{
					credit_account: "INC003",
					original_amount: 50000,
					original_currency: "MYR",
					amount: 1500000,
				},
			],
			error: null,
		});

		const result = await getSstStatus();

		expect(result.success).toBe(true);
		if (!result.success) return;
		// INC003 should not be counted in either taxable or nonTaxable
		expect(result.data.taxableTotal).toBe(100000);
		expect(result.data.nonTaxableTotal).toBe(0);
	});
});
