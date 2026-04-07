import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Tables } from "@/lib/types/supabase";
import { TaxReliefList } from "../tax-relief-list";

type TaxReliefRecord = Tables<"tax_relief_records">;

const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();

vi.mock("@/app/_actions/tax-relief-actions", () => ({
	createTaxRelief: (...args: unknown[]) => mockCreate(...args),
	updateTaxRelief: (...args: unknown[]) => mockUpdate(...args),
	deleteTaxRelief: (...args: unknown[]) => mockDelete(...args),
}));

vi.mock("@/hooks/use-toast", () => ({
	useToast: () => ({ toast: vi.fn() }),
}));

const baseRecord: TaxReliefRecord = {
	id: "rec-1",
	user_id: "user-1",
	relief_code: "TR001",
	assessment_year: "2024",
	amount: 5000,
	receipt_date: "2024-06-15",
	description: "テスト控除",
	deleted_at: null,
	created_at: "2024-01-01T00:00:00Z",
	updated_at: "2024-01-01T00:00:00Z",
};

const records: TaxReliefRecord[] = [
	baseRecord,
	{
		...baseRecord,
		id: "rec-2",
		relief_code: "TR002",
		amount: 3000,
		receipt_date: "2024-07-20",
		description: "EPF拠出",
	},
];

describe("TaxReliefList", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("控除記録の一覧を表示する", () => {
		render(<TaxReliefList records={records} assessmentYear="2024" />);
		expect(screen.getByText("Individual and Dependent Relatives")).toBeDefined();
		expect(screen.getByText("EPF / Voluntary Contribution")).toBeDefined();
		expect(screen.getByText("5,000")).toBeDefined();
		expect(screen.getByText("3,000")).toBeDefined();
	});

	it("記録が0件の場合に空メッセージを表示する", () => {
		render(<TaxReliefList records={[]} assessmentYear="2024" />);
		expect(screen.getByText("控除記録がありません。")).toBeDefined();
	});

	it("追加フォームを表示・送信できる", async () => {
		mockCreate.mockResolvedValue({ success: true, data: baseRecord });
		render(<TaxReliefList records={[]} assessmentYear="2024" />);

		fireEvent.click(screen.getByRole("button", { name: "追加" }));

		const amountInput = screen.getByLabelText("金額");
		const dateInput = screen.getByLabelText("日付");

		fireEvent.change(amountInput, { target: { value: "5000" } });
		fireEvent.change(dateInput, { target: { value: "2024-06-15" } });

		fireEvent.click(screen.getByRole("button", { name: "保存" }));

		await waitFor(() => {
			expect(mockCreate).toHaveBeenCalledWith(
				expect.objectContaining({
					amount: 5000,
					receipt_date: "2024-06-15",
					assessment_year: "2024",
				}),
			);
		});
	});

	it("編集ボタンで編集モードに切り替わる", () => {
		render(<TaxReliefList records={records} assessmentYear="2024" />);

		const editButton = screen.getAllByTitle("編集")[0] as HTMLElement;
		fireEvent.click(editButton);

		expect(screen.getByDisplayValue("5000")).toBeDefined();
	});

	it("編集を送信できる", async () => {
		mockUpdate.mockResolvedValue({ success: true, data: baseRecord });
		render(<TaxReliefList records={records} assessmentYear="2024" />);

		const editButton = screen.getAllByTitle("編集")[0] as HTMLElement;
		fireEvent.click(editButton);

		const amountInput = screen.getByDisplayValue("5000");
		fireEvent.change(amountInput, { target: { value: "7000" } });

		fireEvent.click(screen.getByRole("button", { name: "保存" }));

		await waitFor(() => {
			expect(mockUpdate).toHaveBeenCalledWith(
				expect.objectContaining({
					id: "rec-1",
					amount: 7000,
				}),
			);
		});
	});

	it("削除ボタンで確認ダイアログが表示され削除できる", async () => {
		mockDelete.mockResolvedValue({ success: true, data: null });
		render(<TaxReliefList records={records} assessmentYear="2024" />);

		const deleteButton = screen.getAllByTitle("削除")[0] as HTMLElement;
		fireEvent.click(deleteButton);

		expect(screen.getByText("この控除記録を削除しますか？")).toBeDefined();

		fireEvent.click(screen.getByRole("button", { name: "削除" }));

		await waitFor(() => {
			expect(mockDelete).toHaveBeenCalledWith("rec-1");
		});
	});

	it("キャンセルボタンで追加フォームを閉じる", () => {
		render(<TaxReliefList records={[]} assessmentYear="2024" />);

		fireEvent.click(screen.getByRole("button", { name: "追加" }));
		expect(screen.getByLabelText("金額")).toBeDefined();

		fireEvent.click(screen.getByRole("button", { name: "キャンセル" }));
		expect(screen.queryByLabelText("金額")).toBeNull();
	});

	it("Server Action失敗時にエラー状態になる", async () => {
		mockCreate.mockResolvedValue({ success: false, error: "エラー発生" });
		render(<TaxReliefList records={[]} assessmentYear="2024" />);

		fireEvent.click(screen.getByRole("button", { name: "追加" }));
		fireEvent.change(screen.getByLabelText("金額"), { target: { value: "5000" } });
		fireEvent.change(screen.getByLabelText("日付"), { target: { value: "2024-06-15" } });
		fireEvent.click(screen.getByRole("button", { name: "保存" }));

		await waitFor(() => {
			expect(mockCreate).toHaveBeenCalled();
		});
	});
});
