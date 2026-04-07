import { z } from "zod";
import { ASSESSMENT_YEARS, TAX_RELIEF_CATEGORIES } from "@/lib/utils/tax-reliefs";

const reliefCodes = Object.keys(TAX_RELIEF_CATEGORIES) as [string, ...string[]];

const amountSchema = z
	.number()
	.int("金額は整数で入力してください")
	.positive("金額は正の数を入力してください")
	.max(999_999_999, "金額が上限を超えています");

const receiptDateSchema = z.string().date("日付はYYYY-MM-DD形式の有効な日付を入力してください");

export const createTaxReliefSchema = z.object({
	relief_code: z.enum(reliefCodes),
	assessment_year: z.enum(ASSESSMENT_YEARS),
	amount: amountSchema,
	receipt_date: receiptDateSchema,
	description: z.string().trim().max(500, "説明は500文字以内で入力してください").optional(),
});

export type CreateTaxReliefInput = z.infer<typeof createTaxReliefSchema>;

export const updateTaxReliefSchema = z.object({
	id: z.string().uuid("無効なIDです"),
	relief_code: z.enum(reliefCodes).optional(),
	assessment_year: z.enum(ASSESSMENT_YEARS).optional(),
	amount: amountSchema.optional(),
	receipt_date: receiptDateSchema.optional(),
	description: z.string().trim().max(500, "説明は500文字以内で入力してください").optional(),
});

export type UpdateTaxReliefInput = z.infer<typeof updateTaxReliefSchema>;

export const deleteTaxReliefSchema = z.object({
	id: z.string().uuid("無効なIDです"),
});

export type DeleteTaxReliefInput = z.infer<typeof deleteTaxReliefSchema>;

export const getTaxReliefsSchema = z.object({
	assessment_year: z.enum(ASSESSMENT_YEARS),
});

export type GetTaxReliefsInput = z.infer<typeof getTaxReliefsSchema>;
