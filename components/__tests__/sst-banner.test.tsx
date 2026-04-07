import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { SstStatus } from "@/app/_actions/sst-actions";
import { SstBanner } from "@/components/sst-banner";

describe("SstBanner", () => {
	it("alertLevel=none の場合は何も表示しない", () => {
		const data: SstStatus = {
			taxableTotal: 300000,
			nonTaxableTotal: 50000,
			alertLevel: "none",
			registrationRequired: false,
		};
		const { container } = render(<SstBanner data={data} />);
		expect(container.innerHTML).toBe("");
	});

	it("alertLevel=yellow で黄色警告バナーを表示", () => {
		const data: SstStatus = {
			taxableTotal: 420000,
			nonTaxableTotal: 30000,
			alertLevel: "yellow",
			registrationRequired: false,
		};
		render(<SstBanner data={data} />);
		expect(screen.getByTestId("sst-banner")).toHaveClass("border-yellow-500");
		expect(screen.getByText("SST登録閾値に近づいています")).toBeDefined();
		expect(screen.getByText(/RM420,000/)).toBeDefined();
		expect(screen.getByText(/あと RM80,000 で登録義務が発生します/)).toBeDefined();
	});

	it("alertLevel=red で赤色警告バナーを表示", () => {
		const data: SstStatus = {
			taxableTotal: 490000,
			nonTaxableTotal: 10000,
			alertLevel: "red",
			registrationRequired: false,
		};
		render(<SstBanner data={data} />);
		expect(screen.getByTestId("sst-banner")).toHaveClass("border-red-500");
		expect(screen.getByText("SST登録閾値に近づいています")).toBeDefined();
		expect(screen.getByText(/あと RM10,000 で登録義務が発生します/)).toBeDefined();
	});

	it("registrationRequired=true でSST登録ガイダンスを表示", () => {
		const data: SstStatus = {
			taxableTotal: 510000,
			nonTaxableTotal: 20000,
			alertLevel: "red",
			registrationRequired: true,
		};
		render(<SstBanner data={data} />);
		expect(screen.getByText("SST登録が必要です")).toBeDefined();
		expect(screen.getByText(/RMCD（マレーシア関税局）にSST登録を申請してください/)).toBeDefined();
	});
});
