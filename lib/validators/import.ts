import { z } from "zod";
import { UPLOAD_LIMITS } from "@/lib/utils/constants";

const parsedTransactionSchema = z.object({
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
	description: z.string().min(1).max(200),
	amount: z.number(),
	originalAmount: z.number().optional(),
	originalCurrency: z.string().optional(),
	exchangeRate: z.number().optional(),
	fees: z.number().optional(),
	payeeName: z.string().optional(),
	reference: z.string().optional(),
});

export const importTransactionsSchema = z.object({
	transactions: z
		.array(parsedTransactionSchema)
		.min(1, "1件以上の取引が必要です")
		.max(UPLOAD_LIMITS.MAX_ROWS_PER_IMPORT),
	fileName: z.string().min(1),
	fileSize: z.number().positive().max(UPLOAD_LIMITS.MAX_FILE_SIZE),
	csvFormat: z.enum(["wise", "revolut", "smbc", "rakuten", "generic"]),
});

export type ImportTransactionsInput = z.infer<typeof importTransactionsSchema>;
