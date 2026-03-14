import { z } from "zod";
import { ACCOUNT_CATEGORIES } from "@/lib/utils/constants";

const accountCodes = Object.keys(ACCOUNT_CATEGORIES) as [string, ...string[]];

export const classificationResultSchema = z.object({
	classifications: z.array(
		z.object({
			id: z.string(),
			debitAccount: z.enum(accountCodes),
			creditAccount: z.enum(accountCodes),
			confidence: z.enum(["HIGH", "MEDIUM", "LOW"]),
			reason: z.string(),
		}),
	),
});

export type ClassificationResult = z.infer<typeof classificationResultSchema>;

export interface TransactionInput {
	id?: string;
	date: string;
	description: string;
	amount: number;
}

export interface ClassifiedTransaction {
	id: string;
	debitAccount: string;
	creditAccount: string;
	confidence: "HIGH" | "MEDIUM" | "LOW";
	reason: string;
}
