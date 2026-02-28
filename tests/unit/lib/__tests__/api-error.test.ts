import { describe, expect, it } from "vitest";
import { API_ERROR_CODES, ApiError, handleApiError } from "@/lib/api/error";

describe("handleApiError", () => {
	it("ApiErrorを適切に処理する", () => {
		const error = new ApiError(API_ERROR_CODES.UNAUTHORIZED, "ログインが必要です", 401);
		const result = handleApiError(error);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error).toBe("ログインが必要です");
			expect(result.code).toBe("UNAUTHORIZED");
		}
	});

	it("Zodエラーの詳細を漏らさない", () => {
		const zodLikeError = {
			issues: [{ path: ["email"], message: "Invalid email" }],
		};
		const result = handleApiError(zodLikeError);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error).toBe("入力内容を確認してください。");
			expect(result.code).toBe("VALIDATION_ERROR");
			// 詳細が漏れていないことを確認
			expect(result.error).not.toContain("email");
			expect(result.error).not.toContain("Invalid");
		}
	});

	it("Supabase RLS違反を処理する", () => {
		const supabaseError = {
			code: "42501",
			message: "new row violates row-level security policy",
		};
		const result = handleApiError(supabaseError);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.code).toBe("FORBIDDEN");
			// 内部エラーメッセージが漏れていないことを確認
			expect(result.error).not.toContain("row-level security");
		}
	});

	it("Supabase重複エラーを処理する", () => {
		const supabaseError = {
			code: "23505",
			message: "duplicate key value",
		};
		const result = handleApiError(supabaseError);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.code).toBe("CONFLICT");
		}
	});

	it("不明なエラーの詳細を露出しない", () => {
		const result = handleApiError(new Error("secret internal error"));

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error).toBe("予期しないエラーが発生しました。");
			expect(result.error).not.toContain("secret");
		}
	});

	it("文字列エラーも安全に処理する", () => {
		const result = handleApiError("some string error");

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.code).toBe("INTERNAL_ERROR");
		}
	});
});
