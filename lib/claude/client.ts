import Anthropic from "@anthropic-ai/sdk";
import { ApiError, handleApiError } from "@/lib/api/error";
import type { ApiResponse } from "@/lib/types/api";
import { aiClassifyRequestSchema } from "@/lib/validators/transaction";
import { buildUserPrompt, CLASSIFY_TOOL, SYSTEM_PROMPT } from "./prompts";
import {
	type ClassifiedTransaction,
	classificationResultSchema,
	type TransactionInput,
} from "./types";

export async function classifyTransactions(
	transactions: TransactionInput[],
	userInstruction?: string,
): Promise<ApiResponse<ClassifiedTransaction[]>> {
	try {
		const parsed = aiClassifyRequestSchema.safeParse({ transactions });
		if (!parsed.success) {
			return { success: false, error: "入力内容を確認してください。", code: "VALIDATION_ERROR" };
		}

		const client = new Anthropic();
		const response = await client.messages.create({
			model: "claude-sonnet-4-5-20250929",
			max_tokens: 4096,
			system: SYSTEM_PROMPT,
			tools: [CLASSIFY_TOOL],
			tool_choice: { type: "tool", name: "classify_transactions" },
			messages: [
				{ role: "user", content: buildUserPrompt(parsed.data.transactions, userInstruction) },
			],
		});

		const toolUseBlock = response.content.find(
			(block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
		);
		if (!toolUseBlock) {
			throw new ApiError("AI_ERROR", "AIからの応答を取得できませんでした。");
		}

		const result = classificationResultSchema.safeParse(toolUseBlock.input);
		if (!result.success) {
			throw new ApiError("AI_ERROR", "AIの応答形式が不正です。");
		}

		return { success: true, data: result.data.classifications };
	} catch (error) {
		if (isRateLimitError(error)) {
			return {
				success: false,
				error: "リクエスト制限に達しました。しばらく待ってから再試行してください。",
				code: "RATE_LIMIT",
			};
		}
		if (error instanceof ApiError) {
			return handleApiError(error);
		}
		return {
			success: false,
			error: "AI仕訳推定に失敗しました。",
			code: "AI_ERROR",
		};
	}
}

function isRateLimitError(error: unknown): boolean {
	return (
		typeof error === "object" &&
		error !== null &&
		"status" in error &&
		(error as { status: number }).status === 429
	);
}
