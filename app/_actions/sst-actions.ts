"use server";

import { subMonths } from "date-fns";
import { handleApiError } from "@/lib/api/error";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ApiResponse } from "@/lib/types/api";
import { SST_THRESHOLDS } from "@/lib/utils/constants";

export type SstAlertLevel = "none" | "yellow" | "red";

export type SstStatus = {
	taxableTotal: number;
	nonTaxableTotal: number;
	alertLevel: SstAlertLevel;
	registrationRequired: boolean;
};

function determineAlertLevel(taxableTotal: number): SstAlertLevel {
	if (taxableTotal > SST_THRESHOLDS.WARNING_RED) return "red";
	if (taxableTotal > SST_THRESHOLDS.WARNING_YELLOW) return "yellow";
	return "none";
}

export async function getSstStatus(): Promise<ApiResponse<SstStatus>> {
	try {
		const authResult = await requireAuth();
		if (!authResult.success) return authResult;

		const supabase = await createClient();
		const userId = authResult.data.id;
		const windowStart = subMonths(new Date(), SST_THRESHOLDS.ROLLING_MONTHS)
			.toISOString()
			.split("T")[0];

		const { data: transactions, error } = await supabase
			.from("transactions")
			.select("credit_account, original_amount, original_currency, amount")
			.eq("user_id", userId)
			.gte("transaction_date", windowStart)
			.in("credit_account", [SST_THRESHOLDS.TAXABLE_ACCOUNT, SST_THRESHOLDS.NON_TAXABLE_ACCOUNT])
			.is("deleted_at", null);

		if (error) throw error;

		let taxableTotal = 0;
		let nonTaxableTotal = 0;

		for (const tx of transactions ?? []) {
			// SST閾値はMYR単位のため、MYR以外の通貨の取引はスキップ
			const currency = (tx.original_currency as string | null) ?? "MYR";
			if (currency !== "MYR") continue;

			const amount = Number(tx.original_amount ?? tx.amount) || 0;

			if (tx.credit_account === SST_THRESHOLDS.TAXABLE_ACCOUNT) {
				taxableTotal += amount;
			} else if (tx.credit_account === SST_THRESHOLDS.NON_TAXABLE_ACCOUNT) {
				nonTaxableTotal += amount;
			}
		}

		return {
			success: true,
			data: {
				taxableTotal,
				nonTaxableTotal,
				alertLevel: determineAlertLevel(taxableTotal),
				registrationRequired: taxableTotal > SST_THRESHOLDS.REGISTRATION_REQUIRED,
			},
		};
	} catch (error) {
		return handleApiError(error);
	}
}
