import { describe, expect, it } from "vitest";
import { decodeShiftJis } from "@/lib/csv/decode";

describe("CSV デコード", () => {
	describe("decodeShiftJis", () => {
		it("Shift-JIS バイト列をUTF-8文字列にデコードする", () => {
			// "テスト" in Shift-JIS: 0x83 0x65 0x83 0x58 0x83 0x67
			const buffer = new Uint8Array([0x83, 0x65, 0x83, 0x58, 0x83, 0x67]).buffer;
			expect(decodeShiftJis(buffer)).toBe("テスト");
		});

		it("ASCII文字はそのまま返す", () => {
			const encoder = new TextEncoder();
			const buffer = encoder.encode("hello").buffer;
			expect(decodeShiftJis(buffer)).toBe("hello");
		});

		it("空のバッファは空文字を返す", () => {
			const buffer = new ArrayBuffer(0);
			expect(decodeShiftJis(buffer)).toBe("");
		});

		it("Shift-JIS の日本語カード明細をデコードする", () => {
			// "利用" in Shift-JIS: 0x97 0x98 0x97 0x70
			const buffer = new Uint8Array([0x97, 0x98, 0x97, 0x70]).buffer;
			expect(decodeShiftJis(buffer)).toBe("利用");
		});
	});
});
