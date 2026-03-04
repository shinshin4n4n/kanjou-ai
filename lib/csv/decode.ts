/**
 * Shift-JIS エンコードされたバイナリデータをUTF-8文字列にデコード
 */
export function decodeShiftJis(buffer: ArrayBuffer): string {
	return new TextDecoder("shift-jis").decode(buffer);
}
