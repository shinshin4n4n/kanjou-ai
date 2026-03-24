import { describe, expect, it } from "vitest";
import { ACCOUNT_CATEGORIES, type AccountCode } from "@/lib/utils/constants";

type CategoryInfo = (typeof ACCOUNT_CATEGORIES)[AccountCode];

describe("ACCOUNT_CATEGORIES", () => {
	const entries = Object.entries(ACCOUNT_CATEGORIES) as [AccountCode, CategoryInfo][];
	const codes = Object.keys(ACCOUNT_CATEGORIES) as AccountCode[];

	it("31件のエントリを持つ（INC:7 + EXP:13 + CAP:5 + AST:4 + LIA:2）", () => {
		expect(entries).toHaveLength(31);
	});

	it("全エントリに name, type, taxDefault がある", () => {
		for (const [, info] of entries) {
			expect(info).toHaveProperty("name");
			expect(info).toHaveProperty("type");
			expect(info).toHaveProperty("taxDefault");
			expect(typeof info.name).toBe("string");
			expect(info.name.length).toBeGreaterThan(0);
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
			const info = ACCOUNT_CATEGORIES[code];
			expect(info).toHaveProperty("capitalAllowance");
		}
	});

	it("EXP008（Entertainment）に deductionLimit: 0.5 がある", () => {
		expect(ACCOUNT_CATEGORIES.EXP008).toHaveProperty("deductionLimit", 0.5);
	});

	it("CAP001（ICT Equipment）の IA=0.4, AA=0.2", () => {
		expect(ACCOUNT_CATEGORIES.CAP001).toHaveProperty("capitalAllowance", {
			ia: 0.4,
			aa: 0.2,
		});
	});
});
