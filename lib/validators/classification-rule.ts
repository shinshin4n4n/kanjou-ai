import { z } from "zod";

export const createClassificationRuleSchema = z.object({
	instruction: z
		.string()
		.trim()
		.min(1, "指示テキストを入力してください")
		.max(500, "指示テキストは500文字以内で入力してください"),
});

export type CreateClassificationRuleInput = z.infer<typeof createClassificationRuleSchema>;

export const deleteClassificationRuleSchema = z.object({
	id: z.string().uuid("無効なIDです"),
});

export type DeleteClassificationRuleInput = z.infer<typeof deleteClassificationRuleSchema>;
