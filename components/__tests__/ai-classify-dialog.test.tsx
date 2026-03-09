import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockToast = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
	useToast: () => ({ toast: mockToast }),
}));

vi.mock("@/app/_actions/classification-rule-actions", () => ({
	saveClassificationRule: vi.fn(),
	getClassificationRules: vi.fn(),
	deleteClassificationRule: vi.fn(),
}));

import type { AiClassificationRow } from "@/app/_actions/ai-classify-actions";
import {
	deleteClassificationRule,
	getClassificationRules,
	saveClassificationRule,
} from "@/app/_actions/classification-rule-actions";
import { AiClassifyDialog } from "../ai-classify-dialog";

const mockSave = vi.mocked(saveClassificationRule);
const mockGet = vi.mocked(getClassificationRules);
const mockDelete = vi.mocked(deleteClassificationRule);

const sampleResults: AiClassificationRow[] = [
	{
		id: "tx-1",
		description: "AWS利用料",
		amount: 10000,
		debitAccount: "expense_communication",
		creditAccount: "liability_credit_card",
		confidence: "HIGH",
		reason: "クラウドサービス利用",
	},
];

function renderDialog(overrides = {}) {
	const defaultProps = {
		results: sampleResults,
		open: true,
		onClose: vi.fn(),
		onApply: vi.fn().mockResolvedValue(undefined),
		onReClassify: vi.fn().mockResolvedValue(undefined),
	};
	return render(<AiClassifyDialog {...defaultProps} {...overrides} />);
}

describe("AiClassifyDialog ルール保存エラーハンドリング", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockGet.mockResolvedValue({ success: true, data: [] });
	});

	it("保存失敗時にエラーメッセージをtoast descriptionに表示する", async () => {
		mockSave.mockResolvedValue({
			success: false,
			error: "ルールは最大20件までです。",
			code: "VALIDATION_ERROR",
		});

		renderDialog();

		const textarea = screen.getByPlaceholderText(/指示を入力/);
		fireEvent.change(textarea, { target: { value: "テストルール" } });

		const saveButton = screen.getByRole("button", { name: /保存/ });
		fireEvent.click(saveButton);

		await waitFor(() => {
			expect(mockToast).toHaveBeenCalledWith(
				expect.objectContaining({
					title: "ルールの保存に失敗しました",
					description: "ルールは最大20件までです。",
					variant: "destructive",
				}),
			);
		});
	});

	it("保存中にサーバーアクションがthrowした場合にエラーtoastを表示する", async () => {
		mockSave.mockRejectedValue(new Error("Network Error"));

		renderDialog();

		const textarea = screen.getByPlaceholderText(/指示を入力/);
		fireEvent.change(textarea, { target: { value: "テストルール" } });

		const saveButton = screen.getByRole("button", { name: /保存/ });
		fireEvent.click(saveButton);

		await waitFor(() => {
			expect(mockToast).toHaveBeenCalledWith(
				expect.objectContaining({
					title: "ルールの保存に失敗しました",
					variant: "destructive",
				}),
			);
		});
	});

	it("削除失敗時にエラーメッセージをtoast descriptionに表示する", async () => {
		const ruleId = "550e8400-e29b-41d4-a716-446655440000";
		mockGet.mockResolvedValue({
			success: true,
			data: [{ id: ruleId, instruction: "既存ルール", created_at: "2026-03-01T00:00:00Z" }],
		});
		mockDelete.mockResolvedValue({
			success: false,
			error: "削除権限がありません。",
			code: "FORBIDDEN",
		});

		renderDialog();

		await waitFor(() => {
			expect(screen.getByText("既存ルール")).toBeInTheDocument();
		});

		const deleteButtons = screen.getAllByRole("button").filter((btn) => {
			return btn.querySelector("svg.lucide-x") !== null;
		});
		expect(deleteButtons.length).toBeGreaterThan(0);
		fireEvent.click(deleteButtons[0]!);

		await waitFor(() => {
			expect(mockToast).toHaveBeenCalledWith(
				expect.objectContaining({
					title: "ルールの削除に失敗しました",
					description: "削除権限がありません。",
					variant: "destructive",
				}),
			);
		});
	});

	it("削除中にサーバーアクションがthrowした場合にエラーtoastを表示する", async () => {
		const ruleId = "550e8400-e29b-41d4-a716-446655440000";
		mockGet.mockResolvedValue({
			success: true,
			data: [{ id: ruleId, instruction: "既存ルール", created_at: "2026-03-01T00:00:00Z" }],
		});
		mockDelete.mockRejectedValue(new Error("Network Error"));

		renderDialog();

		await waitFor(() => {
			expect(screen.getByText("既存ルール")).toBeInTheDocument();
		});

		const deleteButtons = screen.getAllByRole("button").filter((btn) => {
			return btn.querySelector("svg.lucide-x") !== null;
		});
		fireEvent.click(deleteButtons[0]!);

		await waitFor(() => {
			expect(mockToast).toHaveBeenCalledWith(
				expect.objectContaining({
					title: "ルールの削除に失敗しました",
					variant: "destructive",
				}),
			);
		});
	});
});
