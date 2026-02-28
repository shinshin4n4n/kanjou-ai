import { z } from "zod/v4";

export const loginSchema = z.object({
	email: z.email("有効なメールアドレスを入力してください。"),
	password: z.string().min(1, "パスワードを入力してください。"),
});

export const signupSchema = z.object({
	email: z.email("有効なメールアドレスを入力してください。"),
	password: z.string().min(8, "パスワードは8文字以上で入力してください。"),
});
