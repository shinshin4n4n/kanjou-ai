import { z } from "zod";
import { ACCOUNT_CATEGORIES, TAX_CATEGORIES } from "@/lib/utils/constants";

const accountCodeSchema = z
	.string()
	.refine((code) => code in ACCOUNT_CATEGORIES, { message: "無効な勘定科目コードです" });

const taxCategorySchema = z
	.string()
	.refine((cat) => cat in TAX_CATEGORIES, { message: "無効な税区分です" });

export const createTransactionSchema = z.object({
	transactionDate: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/, "日付はYYYY-MM-DD形式で入力してください")
		.refine((date) => !Number.isNaN(new Date(date).getTime()), "有効な日付を入力してください"),
	description: z.string().min(1, "摘要を入力してください").max(200).trim(),
	amount: z.number().int("整数で入力").positive("正の値で入力").max(999_999_999),
	debitAccount: accountCodeSchema,
	creditAccount: accountCodeSchema,
	taxCategory: taxCategorySchema.optional(),
	memo: z.string().max(500).optional(),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;

export const updateTransactionSchema = createTransactionSchema.partial().extend({
	id: z.string().uuid("無効なIDです"),
	isConfirmed: z.boolean().optional(),
});

export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;

export const aiClassifyRequestSchema = z.object({
	transactions: z
		.array(
			z.object({
				id: z.string().uuid().optional(),
				date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
				description: z.string().min(1).max(200),
				amount: z.number().int().positive(),
			}),
		)
		.min(1, "1件以上の取引を指定してください")
		.max(50, "一度に処理できるのは50件までです"),
});

export type AiClassifyRequestInput = z.infer<typeof aiClassifyRequestSchema>;

export const getTransactionsSchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	perPage: z.coerce.number().int().min(1).max(100).default(20),
	startDate: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/)
		.optional(),
	endDate: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/)
		.optional(),
	isConfirmed: z.enum(["true", "false", "all"]).default("all"),
	accountCategory: z.string().optional(),
	sortBy: z.enum(["transaction_date", "amount", "created_at"]).default("transaction_date"),
	sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type GetTransactionsInput = z.infer<typeof getTransactionsSchema>;

export const exportRequestSchema = z.object({
	format: z.enum(["yayoi", "freee", "generic"]),
	startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
	endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
	confirmedOnly: z.boolean().default(true),
});

export type ExportRequestInput = z.infer<typeof exportRequestSchema>;
