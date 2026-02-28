import type { ApiResponse } from "@/lib/types/api";

/**
 * APIエラーコード定数
 */
export const API_ERROR_CODES = {
	UNAUTHORIZED: "UNAUTHORIZED",
	FORBIDDEN: "FORBIDDEN",
	NOT_FOUND: "NOT_FOUND",
	VALIDATION_ERROR: "VALIDATION_ERROR",
	CONFLICT: "CONFLICT",
	RATE_LIMIT: "RATE_LIMIT",
	AI_ERROR: "AI_ERROR",
	CSV_PARSE_ERROR: "CSV_PARSE_ERROR",
	EXPORT_ERROR: "EXPORT_ERROR",
	INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES];

/**
 * カスタムAPIエラー
 */
export class ApiError extends Error {
	constructor(
		public code: ApiErrorCode,
		message: string,
		public statusCode: number = 500,
	) {
		super(message);
		this.name = "ApiError";
	}
}

/**
 * 集中エラーハンドリング
 *
 * TubeReview教訓:
 * - ZodErrorの詳細をクライアントに漏らさない
 * - スタックトレースを露出しない
 * - ユーザーのメールアドレスをログに出力しない
 * - 全エラーをここで一元処理する
 */
export function handleApiError(error: unknown): ApiResponse<never> {
	// カスタムAPIエラー
	if (error instanceof ApiError) {
		return {
			success: false,
			error: error.message,
			code: error.code,
		};
	}

	// Zodバリデーションエラー
	if (isZodError(error)) {
		return {
			success: false,
			error: "入力内容を確認してください。",
			code: API_ERROR_CODES.VALIDATION_ERROR,
		};
	}

	// Supabase エラー
	if (isSupabaseError(error)) {
		// RLS違反
		if (error.code === "42501") {
			return {
				success: false,
				error: "この操作を行う権限がありません。",
				code: API_ERROR_CODES.FORBIDDEN,
			};
		}
		// 重複
		if (error.code === "23505") {
			return {
				success: false,
				error: "この項目は既に存在します。",
				code: API_ERROR_CODES.CONFLICT,
			};
		}
		return {
			success: false,
			error: "データベースエラーが発生しました。",
			code: API_ERROR_CODES.INTERNAL_ERROR,
		};
	}

	// 不明なエラー（詳細を露出しない）
	// biome-ignore lint/suspicious/noConsole: console.error は本番でも使用する（CLAUDE.md ルール）
	console.error("[handleApiError] Unexpected error:", error);
	return {
		success: false,
		error: "予期しないエラーが発生しました。",
		code: API_ERROR_CODES.INTERNAL_ERROR,
	};
}

/**
 * Zodエラー型ガード
 */
function isZodError(error: unknown): boolean {
	return (
		typeof error === "object" &&
		error !== null &&
		"issues" in error &&
		Array.isArray((error as Record<string, unknown>).issues)
	);
}

/**
 * Supabaseエラー型ガード
 */
function isSupabaseError(error: unknown): error is { code: string; message: string } {
	return (
		typeof error === "object" &&
		error !== null &&
		"code" in error &&
		"message" in error &&
		typeof (error as Record<string, unknown>).code === "string"
	);
}
