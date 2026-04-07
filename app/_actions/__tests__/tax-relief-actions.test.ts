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
	getTaxReliefs,
	createTaxRelief,
	updateTaxRelief,
	deleteTaxRelief,
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
