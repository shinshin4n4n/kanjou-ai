"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn, signInWithGoogle, signUp } from "@/app/_actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function LoginPage() {
	const router = useRouter();
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	async function handleSubmit(formData: FormData, mode: "login" | "signup") {
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
		<div className="flex min-h-screen items-center justify-center p-4">
			<Card className="w-full max-w-sm">
				<CardHeader className="text-center">
					<CardTitle className="text-2xl font-bold">KanjouAI</CardTitle>
					<CardDescription>AI仕訳管理で確定申告をサポート</CardDescription>
				</CardHeader>
				<CardContent>
					<Tabs defaultValue="login" onValueChange={() => setError("")}>
						<TabsList className="grid w-full grid-cols-2">
							<TabsTrigger value="login">ログイン</TabsTrigger>
							<TabsTrigger value="signup">新規登録</TabsTrigger>
						</TabsList>

						<TabsContent value="login">
							<form action={(formData) => handleSubmit(formData, "login")} className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="login-email">メールアドレス</Label>
									<Input
										id="login-email"
										name="email"
										type="email"
										required
										placeholder="you@example.com"
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="login-password">パスワード</Label>
									<Input id="login-password" name="password" type="password" required />
								</div>
								{error && <p className="text-sm text-destructive">{error}</p>}
								<Button type="submit" className="w-full" disabled={loading}>
									{loading ? "処理中..." : "ログイン"}
								</Button>
							</form>
						</TabsContent>

						<TabsContent value="signup">
							<form action={(formData) => handleSubmit(formData, "signup")} className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="signup-email">メールアドレス</Label>
									<Input
										id="signup-email"
										name="email"
										type="email"
										required
										placeholder="you@example.com"
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="signup-password">パスワード（8文字以上）</Label>
									<Input
										id="signup-password"
										name="password"
										type="password"
										required
										minLength={8}
									/>
								</div>
								{error && <p className="text-sm text-destructive">{error}</p>}
								<Button type="submit" className="w-full" disabled={loading}>
									{loading ? "処理中..." : "新規登録"}
								</Button>
							</form>
						</TabsContent>
					</Tabs>

					<div className="relative my-4">
						<div className="absolute inset-0 flex items-center">
							<span className="w-full border-t" />
						</div>
						<div className="relative flex justify-center text-xs uppercase">
							<span className="bg-card px-2 text-muted-foreground">または</span>
						</div>
					</div>

					<Button type="button" variant="outline" className="w-full" onClick={handleGoogleSignIn}>
						Googleでログイン
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
