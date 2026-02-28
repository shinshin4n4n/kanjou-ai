import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { ApiResponse } from "@/lib/types/api";

export async function getUser(): Promise<User | null> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	return user;
}

export async function requireAuth(): Promise<ApiResponse<User>> {
	const user = await getUser();
	if (!user) {
		return {
			success: false,
			error: "ログインが必要です。",
			code: "UNAUTHORIZED",
		};
	}
	return { success: true, data: user };
}
