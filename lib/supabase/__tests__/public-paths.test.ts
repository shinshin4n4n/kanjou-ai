import { describe, expect, it } from "vitest";
import { isPublicPath } from "../public-paths";

describe("isPublicPath", () => {
	describe("公開パス", () => {
		it.each(["/", "/login", "/signup", "/auth/callback"])("%s は true を返す", (path) => {
			expect(isPublicPath(path)).toBe(true);
		});
	});

	describe("非公開パス", () => {
		it.each([
			"/dashboard",
			"/transactions",
			"/settings",
			"/export",
			"/import",
		])("%s は false を返す", (path) => {
			expect(isPublicPath(path)).toBe(false);
		});
	});

	describe("エッジケース", () => {
		it("末尾スラッシュ付き /login/ は false を返す", () => {
			expect(isPublicPath("/login/")).toBe(false);
		});

		it("部分一致 /login-page は false を返す", () => {
			expect(isPublicPath("/login-page")).toBe(false);
		});

		it("サブパス /auth/callback/extra は false を返す", () => {
			expect(isPublicPath("/auth/callback/extra")).toBe(false);
		});
	});
});
