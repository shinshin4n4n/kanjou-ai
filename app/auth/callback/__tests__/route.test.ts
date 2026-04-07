import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
	createClient: vi.fn(),
}));

import { GET } from "@/app/auth/callback/route";
import { createClient } from "@/lib/supabase/server";

const mockExchangeCodeForSession = vi.fn();
const mockCreateClient = vi.mocked(createClient);

beforeEach(() => {
	vi.clearAllMocks();
	mockCreateClient.mockResolvedValue({
		auth: {
			exchangeCodeForSession: mockExchangeCodeForSession,
		},
	} as unknown as Awaited<ReturnType<typeof createClient>>);
});

function createRequest(url: string): Request {
	return new Request(url);
}

describe("GET /auth/callback", () => {
	it("有効なcodeでセッション交換後にダッシュボードへリダイレクトする", async () => {
		mockExchangeCodeForSession.mockResolvedValue({ data: {}, error: null });

		const response = await GET(
			createRequest("http://localhost:3000/auth/callback?code=valid-code"),
		);

		expect(mockExchangeCodeForSession).toHaveBeenCalledWith("valid-code");
		expect(response.status).toBe(307);
		const locationHeader = response.headers.get("location") ?? "";
		expect(new URL(locationHeader).pathname).toBe("/dashboard");
	});

	it("codeパラメータがない場合はログインページへリダイレクトする", async () => {
		const response = await GET(createRequest("http://localhost:3000/auth/callback"));

		expect(mockExchangeCodeForSession).not.toHaveBeenCalled();
		expect(response.status).toBe(307);
		const location = new URL(response.headers.get("location") ?? "");
		expect(location.pathname).toBe("/login");
		expect(location.searchParams.get("error")).toBe("auth_callback_error");
	});

	it("セッション交換エラー時にログインページへリダイレクトする", async () => {
		mockExchangeCodeForSession.mockResolvedValue({
			data: { session: null },
			error: { message: "Invalid code" },
		});

		const response = await GET(
			createRequest("http://localhost:3000/auth/callback?code=invalid-code"),
		);

		expect(response.status).toBe(307);
		const location = new URL(response.headers.get("location") ?? "");
		expect(location.pathname).toBe("/login");
		expect(location.searchParams.get("error")).toBe("auth_callback_error");
	});
});
