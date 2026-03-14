import type Anthropic from "@anthropic-ai/sdk";
import { ACCOUNT_CATEGORIES } from "@/lib/utils/constants";
import type { TransactionInput } from "./types";

const accountList = Object.entries(ACCOUNT_CATEGORIES)
	.map(([code, info]) => `${code}: ${info.name}（${info.type}）`)
	.join("\n");

const accountCodes = Object.keys(ACCOUNT_CATEGORIES);

export const SYSTEM_PROMPT = `あなたは日本のフリーランスIT技術者向けの確定申告アシスタントです。
取引の摘要から適切な勘定科目を推定してください。

## 使用可能な勘定科目コード
${accountList}

## ルール
- 借方（debitAccount）と貸方（creditAccount）の勘定科目コードを返してください
- 確信度（confidence）を HIGH / MEDIUM / LOW で返してください
- 推定理由（reason）を簡潔に日本語で返してください
- 不明な場合は confidence を LOW にしてください
- 費用の支払いは通常: 借方=費用科目、貸方=資産科目（普通預金など）
- 収入の受取は通常: 借方=資産科目、貸方=収入科目

classify_transactions ツールを使って結果を返してください。`;

export const CLASSIFY_TOOL: Anthropic.Tool = {
	name: "classify_transactions",
	description: "取引の仕訳分類結果を返す",
	input_schema: {
		type: "object",
		properties: {
			classifications: {
				type: "array",
				items: {
					type: "object",
					properties: {
						id: { type: "string", description: "取引ID" },
						debitAccount: { type: "string", enum: accountCodes, description: "借方勘定科目コード" },
						creditAccount: {
							type: "string",
							enum: accountCodes,
							description: "貸方勘定科目コード",
						},
						confidence: { type: "string", enum: ["HIGH", "MEDIUM", "LOW"], description: "確信度" },
						reason: { type: "string", description: "推定理由" },
					},
					required: ["id", "debitAccount", "creditAccount", "confidence", "reason"],
				},
			},
		},
		required: ["classifications"],
	},
};

export function buildUserPrompt(
	transactions: TransactionInput[],
	userInstruction?: string,
): string {
	const items = transactions
		.map(
			(tx, i) => `${i + 1}. [${tx.id ?? "no-id"}] ${tx.date} | ${tx.description} | ${tx.amount}円`,
		)
		.join("\n");

	let prompt = `以下の取引の仕訳を推定してください:\n\n${items}`;
	if (userInstruction?.trim()) {
		prompt += `\n\n## ユーザー指示\n${userInstruction.trim()}`;
	}
	return prompt;
}
