import { describe, expect, it } from "vitest";
import { ACCOUNT_CATEGORIES } from "@/lib/utils/constants";

// 動的アクセスで TDD RED フェーズでも tsc を通す
const categories = ACCOUNT_CATEGORIES as Record<string, Record<string, unknown>>;

describe("ACCOUNT_CATEGORIES", () => {
	const entries = Object.entries(categories);
	const codes = Object.keys(categories);

	it("31件のエントリを持つ（INC:7 + EXP:13 + CAP:5 + AST:4 + LIA:2）", () => {
		expect(entries).toHaveLength(31);
	});

	it("全エントリに name, type, taxDefault がある", () => {
		for (const [, info] of entries) {
			expect(info).toHaveProperty("name");
			expect(info).toHaveProperty("type");
			expect(info).toHaveProperty("taxDefault");
			expect(typeof info.name).toBe("string");
			expect((info.name as string).length).toBeGreaterThan(0);
		}
	});

	it("コードプレフィックスと type が一致する", () => {
		const prefixTypeMap: Record<string, string> = {
			INC: "income",
			EXP: "expense",
			CAP: "capital",
			AST: "asset",
			LIA: "liability",
		};
		for (const [code, info] of entries) {
			const prefix = code.slice(0, 3);
			expect(info.type).toBe(prefixTypeMap[prefix]);
		}
	});

	it("INC001-007 の7件が income タイプ", () => {
		const incCodes = codes.filter((c) => c.startsWith("INC"));
		expect(incCodes).toHaveLength(7);
	});

	it("EXP001-013 の13件が expense タイプ", () => {
		const expCodes = codes.filter((c) => c.startsWith("EXP"));
		expect(expCodes).toHaveLength(13);
	});

	it("CAP001-005 の5件が capital タイプで capitalAllowance を持つ", () => {
		const capCodes = codes.filter((c) => c.startsWith("CAP"));
		expect(capCodes).toHaveLength(5);
		for (const code of capCodes) {
			const info = categories[code] as Record<string, unknown> | undefined;
			expect(info).toBeDefined();
			expect(info).toHaveProperty("capitalAllowance");
			const ca = info?.capitalAllowance as { ia: number; aa: number };
			expect(typeof ca.ia).toBe("number");
			expect(typeof ca.aa).toBe("number");
		}
	});

	it("EXP008（Entertainment）に deductionLimit: 0.5 がある", () => {
		expect(categories.EXP008).toHaveProperty("deductionLimit", 0.5);
	});

	it("CAP001（ICT Equipment）の IA=0.4, AA=0.2", () => {
		const ca = categories.CAP001?.capitalAllowance as {
			ia: number;
			aa: number;
		};
		expect(ca.ia).toBe(0.4);
		expect(ca.aa).toBe(0.2);
	});
});
