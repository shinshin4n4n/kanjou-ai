"use server";

import { revalidatePath } from "next/cache";
import { handleApiError } from "@/lib/api/error";
import { createClient } from "@/lib/supabase/server";
import type { ApiResponse } from "@/lib/types/api";
import { loginSchema, signupSchema } from "@/lib/validators/auth";

export async function signIn(formData: FormData): Promise<ApiResponse<null>> {
	try {
		const parsed = loginSchema.safeParse({
			email: formData.get("email"),
			password: formData.get("password"),
		});

		if (!parsed.success) {
			return {
				success: false,
				error: "メールアドレスとパスワードを正しく入力してください。",
				code: "VALIDATION_ERROR",
			};
		}

		const supabase = await createClient();
		const { error } = await supabase.auth.signInWithPassword(parsed.data);

		if (error) {
			return {
				success: false,
				error: "メールアドレスまたはパスワードが正しくありません。",
				code: "UNAUTHORIZED",
			};
		}

		revalidatePath("/", "layout");
		return { success: true, data: null };
	} catch (error) {
		return handleApiError(error);
	}
}

export async function signUp(formData: FormData): Promise<ApiResponse<null>> {
	try {
		const parsed = signupSchema.safeParse({
			email: formData.get("email"),
			password: formData.get("password"),
		});

		if (!parsed.success) {
			return {
				success: false,
				error: "メールアドレスとパスワード（8文字以上）を入力してください。",
				code: "VALIDATION_ERROR",
			};
		}

		const supabase = await createClient();
		const { error } = await supabase.auth.signUp(parsed.data);

		if (error) {
			return {
				success: false,
				error: "アカウントの作成に失敗しました。",
				code: "INTERNAL_ERROR",
			};
		}

		revalidatePath("/", "layout");
		return { success: true, data: null };
	} catch (error) {
		return handleApiError(error);
	}
}

export async function signInWithGoogle(): Promise<ApiResponse<{ url: string }>> {
	try {
		const supabase = await createClient();
		const { data, error } = await supabase.auth.signInWithOAuth({
			provider: "google",
			options: {
				redirectTo: `${process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL("/auth/callback", process.env.NEXT_PUBLIC_SUPABASE_URL.replace(".supabase.co", "")).href : "/auth/callback"}`,
			},
		});

		if (error || !data.url) {
			return {
				success: false,
				error: "Google認証の開始に失敗しました。",
				code: "INTERNAL_ERROR",
			};
		}

		return { success: true, data: { url: data.url } };
	} catch (error) {
		return handleApiError(error);
	}
}

export async function signOut(): Promise<ApiResponse<null>> {
	try {
		const supabase = await createClient();
		await supabase.auth.signOut();
		revalidatePath("/", "layout");
		return { success: true, data: null };
	} catch (error) {
		return handleApiError(error);
	}
}
