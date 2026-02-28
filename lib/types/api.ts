/**
 * API統一レスポンス型
 *
 * TubeReview教訓: 全Server Actionの戻り値をこの型で統一することで
 * クライアント側のエラーハンドリングが一貫する
 */
export type ApiResponse<T> =
	| { success: true; data: T }
	| { success: false; error: string; code?: string };
