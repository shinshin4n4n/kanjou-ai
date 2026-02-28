import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/types/supabase";

export function createClient() {
	// biome-ignore lint/style/noNonNullAssertion: 環境変数は .env.local で必須設定済み
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
	// biome-ignore lint/style/noNonNullAssertion: 環境変数は .env.local で必須設定済み
	const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

	return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
