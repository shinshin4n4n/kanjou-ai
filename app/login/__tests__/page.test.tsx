import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
	useRouter: vi.fn(),
}));

vi.mock("@/app/_actions/auth", () => ({
	signIn: vi.fn(),
	signUp: vi.fn(),
	signInWithGoogle: vi.fn(),
}));

import { useRouter } from "next/navigation";
import { signInWithGoogle } from "@/app/_actions/auth";
import LoginPage from "@/app/login/page";

const mockPush = vi.fn();
const mockSignInWithGoogle = vi.mocked(signInWithGoogle);

beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(useRouter).mockReturnValue({
		push: mockPush,
		back: vi.fn(),
		forward: vi.fn(),
		refresh: vi.fn(),
		replace: vi.fn(),
		prefetch: vi.fn(),
	});
});

afterEach(() => {
	cleanup();
});

describe("LoginPage Google OAuth", () => {
	it("Googleログインボタンが表示される", () => {
		render(<LoginPage />);

		expect(screen.getByRole("button", { name: /google/i })).toBeInTheDocument();
	});

	it("GoogleログインボタンクリックでsignInWithGoogleが呼ばれる", async () => {
		const mockUrl = "https://accounts.google.com/o/oauth2/auth?client_id=xxx";
		mockSignInWithGoogle.mockResolvedValue({
			success: true,
			data: { url: mockUrl },
		});

		render(<LoginPage />);
		fireEvent.click(screen.getByRole("button", { name: /google/i }));

		await waitFor(() => {
			expect(mockSignInWithGoogle).toHaveBeenCalledOnce();
		});
	});

	it("Google OAuth エラー時にエラーメッセージを表示する", async () => {
		mockSignInWithGoogle.mockResolvedValue({
			success: false,
			error: "Google認証の開始に失敗しました。",
			code: "INTERNAL_ERROR",
		});

		render(<LoginPage />);
		fireEvent.click(screen.getByRole("button", { name: /google/i }));

		await waitFor(() => {
			expect(screen.getByText("Google認証の開始に失敗しました。")).toBeInTheDocument();
		});
	});
});
