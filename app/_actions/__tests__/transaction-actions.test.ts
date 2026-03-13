import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
	requireAuth: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
	createClient: vi.fn(),
}));

vi.mock("next/cache", () => ({
	revalidatePath: vi.fn(),
}));

import {
	bulkConfirmTransactions,
	confirmTransaction,
	createTransaction,
	getTransaction,
	getTransactions,
	type PaginatedTransactions,
	softDeleteTransaction,
	updateTransaction,
} from "@/app/_actions/transaction-actions";

describe("transaction-actions re-export", () => {
	it("query系関数がre-exportされている", () => {
		expect(typeof getTransactions).toBe("function");
		expect(typeof getTransaction).toBe("function");
	});

	it("command系関数がre-exportされている", () => {
		expect(typeof createTransaction).toBe("function");
		expect(typeof updateTransaction).toBe("function");
		expect(typeof softDeleteTransaction).toBe("function");
		expect(typeof confirmTransaction).toBe("function");
		expect(typeof bulkConfirmTransactions).toBe("function");
	});

	it("PaginatedTransactions型がre-exportされている", () => {
		const _typeCheck: PaginatedTransactions = {
			transactions: [],
			total: 0,
			page: 1,
			perPage: 20,
		};
		expect(_typeCheck).toBeDefined();
	});
});
