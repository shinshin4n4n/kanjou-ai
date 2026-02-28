import { z } from "zod/v4";
import { TAX_CATEGORIES } from "@/lib/utils/constants";

export const updateProfileSchema = z.object({
	displayName: z.string().max(50, "表示名は50文字以内で入力してください。").optional(),
	fiscalYearStart: z
		.number()
		.int()
		.min(1, "1〜12の値を入力してください。")
		.max(12, "1〜12の値を入力してください。"),
	defaultTaxRate: z.string().refine((val) => val in TAX_CATEGORIES, {
		message: "有効な税区分を選択してください。",
	}),
});
