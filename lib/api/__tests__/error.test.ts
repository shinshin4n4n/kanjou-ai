import { describe, expect, it, vi } from "vitest";
import { API_ERROR_CODES, ApiError, handleApiError } from "../error";

// console.error を抑制
vi.spyOn(console, "error").mockImplementation(() => {});

describe("handleApiError", () => {
	it("ApiError を受け取り、対応する error と code を返す", () => {
		const error = new ApiError("NOT_FOUND", "見つかりません", 404);
		const result = handleApiError(error);

		expect(result).toEqual({
			success: false,
			error: "見つかりません",
			code: API_ERROR_CODES.NOT_FOUND,
		});
	});

	it("Zod バリデーションエラーを VALIDATION_ERROR として返す", () => {
		const zodLikeError = {
			issues: [{ message: "Required", path: ["name"] }],
		};
		const result = handleApiError(zodLikeError);

		expect(result).toEqual({
			success: false,
			error: "入力内容を確認してください。",
			code: API_ERROR_CODES.VALIDATION_ERROR,
		});
	});

	it("Supabase RLS 違反エラー (42501) を FORBIDDEN として返す", () => {
		const supabaseError = { code: "42501", message: "RLS violation" };
		const result = handleApiError(supabaseError);

		expect(result).toEqual({
			success: false,
			error: "この操作を行う権限がありません。",
			code: API_ERROR_CODES.FORBIDDEN,
		});
	});

	it("Supabase 重複エラー (23505) を CONFLICT として返す", () => {
		const supabaseError = { code: "23505", message: "duplicate key" };
		const result = handleApiError(supabaseError);

		expect(result).toEqual({
			success: false,
			error: "この項目は既に存在します。",
			code: API_ERROR_CODES.CONFLICT,
		});
	});

	it("Supabase その他エラーを INTERNAL_ERROR として返す", () => {
		const supabaseError = { code: "99999", message: "unknown db error" };
		const result = handleApiError(supabaseError);

		expect(result).toEqual({
			success: false,
			error: "データベースエラーが発生しました。",
			code: API_ERROR_CODES.INTERNAL_ERROR,
		});
	});

	it("不明なエラーを INTERNAL_ERROR として返し、詳細を露出しない", () => {
		const result = handleApiError(new Error("unexpected"));

		expect(result).toEqual({
			success: false,
			error: "予期しないエラーが発生しました。",
			code: API_ERROR_CODES.INTERNAL_ERROR,
		});
	});
});
