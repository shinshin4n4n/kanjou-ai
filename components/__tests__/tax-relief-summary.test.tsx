import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { TaxReliefSummaryItem } from "@/lib/utils/tax-reliefs";
import { TaxReliefSummary } from "../tax-relief-summary";

const mkItem = (code: string, name: string, limit: number, used: number): TaxReliefSummaryItem => {
	const exceeded = used > limit;
	const claimable = Math.min(used, limit);
	const percentage = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
	return {
		code: code as TaxReliefSummaryItem["code"],
		name,
		category: "personal",
		limit,
		used,
		claimable,
		percentage,
		exceeded,
	};
};

describe("TaxReliefSummary", () => {
	it("各控除項目のプログレスバーを表示する", () => {
		const items = [mkItem("TR001", "Individual", 9000, 5000)];
		render(<TaxReliefSummary items={items} />);
		expect(screen.getByText("Individual")).toBeDefined();
		expect(screen.getByText(/5,000/)).toBeDefined();
		expect(screen.getByText(/9,000/)).toBeDefined();
		expect(screen.getByRole("progressbar")).toBeDefined();
	});

	it("上限超過時に警告を表示する", () => {
		const items = [mkItem("TR003", "SOCSO", 350, 400)];
		render(<TaxReliefSummary items={items} />);
		expect(screen.getByText(/上限超過/)).toBeDefined();
	});

	it("上限以内の場合は警告を表示しない", () => {
		const items = [mkItem("TR001", "Individual", 9000, 5000)];
		render(<TaxReliefSummary items={items} />);
		expect(screen.queryByText(/上限超過/)).toBeNull();
	});

	it("Form B集計レポートの合計claimable額を表示する", () => {
		const items = [mkItem("TR001", "Individual", 9000, 5000), mkItem("TR003", "SOCSO", 350, 400)];
		render(<TaxReliefSummary items={items} />);
		// claimable: 5000 + 350 = 5350
		expect(screen.getByText(/5,350/)).toBeDefined();
	});

	it("使用額が0の項目も表示する", () => {
		const items = [mkItem("TR001", "Individual", 9000, 0)];
		render(<TaxReliefSummary items={items} />);
		expect(screen.getByText("Individual")).toBeDefined();
		expect(screen.getByText(/RM 0/)).toBeDefined();
	});
});
