import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/app/_actions/profile", () => ({
	getProfile: vi.fn(),
	updateProfile: vi.fn(),
}));

import { getProfile, updateProfile } from "@/app/_actions/profile";
import SettingsPage from "../page";

const mockGetProfile = vi.mocked(getProfile);
const mockUpdateProfile = vi.mocked(updateProfile);

beforeEach(() => {
	vi.clearAllMocks();
	mockGetProfile.mockResolvedValue({
		success: true,
		data: {
			display_name: "テストユーザー",
			fiscal_year_start: 4,
			default_tax_rate: "tax_10",
		},
	});
});

describe("SettingsPage", () => {
	it("読み込み中にローディング表示される", () => {
		mockGetProfile.mockReturnValue(new Promise(() => {}));
		render(<SettingsPage />);
		expect(screen.getByText("読み込み中...")).toBeInTheDocument();
	});

	it("プロフィール読み込み後にフォームが表示される", async () => {
		render(<SettingsPage />);
		await waitFor(() => {
			expect(screen.getByText("プロフィール設定")).toBeInTheDocument();
		});
		expect(screen.getByLabelText("表示名")).toHaveValue("テストユーザー");
	});

	it("保存成功時に成功メッセージが表示される", async () => {
		mockUpdateProfile.mockResolvedValue({ success: true, data: null });
		render(<SettingsPage />);
		await waitFor(() => {
			expect(screen.getByText("保存")).toBeInTheDocument();
		});
		fireEvent.click(screen.getByText("保存"));
		await waitFor(() => {
			expect(screen.getByText("保存しました。")).toBeInTheDocument();
		});
	});

	it("保存失敗時にエラーメッセージが表示される", async () => {
		mockUpdateProfile.mockResolvedValue({
			success: false,
			error: "入力内容を確認してください。",
			code: "VALIDATION_ERROR",
		});
		render(<SettingsPage />);
		await waitFor(() => {
			expect(screen.getByText("保存")).toBeInTheDocument();
		});
		fireEvent.click(screen.getByText("保存"));
		await waitFor(() => {
			expect(screen.getByText("入力内容を確認してください。")).toBeInTheDocument();
		});
	});

	it("表示名を変更できる", async () => {
		render(<SettingsPage />);
		await waitFor(() => {
			expect(screen.getByLabelText("表示名")).toBeInTheDocument();
		});
		const input = screen.getByLabelText("表示名");
		fireEvent.change(input, { target: { value: "新しい名前" } });
		expect(input).toHaveValue("新しい名前");
	});
});
