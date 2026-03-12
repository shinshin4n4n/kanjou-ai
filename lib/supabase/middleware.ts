import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { isPublicPath } from "./public-paths";

export async function updateSession(request: NextRequest) {
	let supabaseResponse = NextResponse.next({ request });

	const supabase = createServerClient(
		env.NEXT_PUBLIC_SUPABASE_URL,
		env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
		{
			cookies: {
				getAll() {
					return request.cookies.getAll();
				},
				setAll(cookiesToSet) {
					for (const { name, value } of cookiesToSet) {
						request.cookies.set(name, value);
					}
					supabaseResponse = NextResponse.next({ request });
					for (const { name, value, options } of cookiesToSet) {
						supabaseResponse.cookies.set(name, value, options);
					}
				},
			},
		},
	);

	const {
		data: { user },
	} = await supabase.auth.getUser();

	// 未認証ユーザーをログインページにリダイレクト
	// 公開ページと認証コールバックはスキップ
	if (!user && !isPublicPath(request.nextUrl.pathname)) {
		const url = request.nextUrl.clone();
		url.pathname = "/login";
		return NextResponse.redirect(url);
	}

	return supabaseResponse;
}
