"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn, signInWithGoogle, signUp } from "@/app/_actions/auth";

export default function LoginPage() {
	const router = useRouter();
	const [mode, setMode] = useState<"login" | "signup">("login");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	async function handleSubmit(formData: FormData) {
		setError("");
		setLoading(true);

		const action = mode === "login" ? signIn : signUp;
		const result = await action(formData);

		if (result.success) {
			router.push("/dashboard");
		} else {
			setError(result.error);
		}
		setLoading(false);
	}

	async function handleGoogleSignIn() {
		setError("");
		const result = await signInWithGoogle();
		if (result.success) {
			window.location.href = result.data.url;
		} else {
			setError(result.error);
		}
	}

	return (
		<div style={{ maxWidth: 400, margin: "80px auto", padding: "0 16px" }}>
			<h1 style={{ fontSize: 24, marginBottom: 24 }}>KanjouAI</h1>

			<div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
				<button
					type="button"
					onClick={() => {
						setMode("login");
						setError("");
					}}
					style={{ fontWeight: mode === "login" ? "bold" : "normal" }}
				>
					ログイン
				</button>
				<button
					type="button"
					onClick={() => {
						setMode("signup");
						setError("");
					}}
					style={{ fontWeight: mode === "signup" ? "bold" : "normal" }}
				>
					新規登録
				</button>
			</div>

			<form action={handleSubmit}>
				<div style={{ marginBottom: 12 }}>
					<label htmlFor="email">メールアドレス</label>
					<br />
					<input
						id="email"
						name="email"
						type="email"
						required
						style={{ width: "100%", padding: 8, marginTop: 4 }}
					/>
				</div>

				<div style={{ marginBottom: 12 }}>
					<label htmlFor="password">パスワード{mode === "signup" ? "（8文字以上）" : ""}</label>
					<br />
					<input
						id="password"
						name="password"
						type="password"
						required
						minLength={mode === "signup" ? 8 : undefined}
						style={{ width: "100%", padding: 8, marginTop: 4 }}
					/>
				</div>

				{error && <p style={{ color: "red", marginBottom: 12 }}>{error}</p>}

				<button
					type="submit"
					disabled={loading}
					style={{ width: "100%", padding: 10, marginBottom: 12 }}
				>
					{loading ? "処理中..." : mode === "login" ? "ログイン" : "新規登録"}
				</button>
			</form>

			<hr style={{ margin: "16px 0" }} />

			<button type="button" onClick={handleGoogleSignIn} style={{ width: "100%", padding: 10 }}>
				Googleでログイン
			</button>
		</div>
	);
}
