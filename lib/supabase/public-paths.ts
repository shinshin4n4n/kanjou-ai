const publicPaths = ["/", "/login", "/signup", "/auth/callback"];

export function isPublicPath(pathname: string): boolean {
	return publicPaths.some((path) => pathname === path);
}
