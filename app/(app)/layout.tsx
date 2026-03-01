"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
	return (
		<SidebarProvider>
			<AppSidebar />
			<SidebarInset>
				<header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
					<SidebarTrigger className="-ml-1" />
					<Separator orientation="vertical" className="mr-2 h-4" />
					<div className="flex flex-1 items-center justify-between">
						<nav aria-label="breadcrumb">
							<span className="text-sm text-muted-foreground">KanjouAI</span>
						</nav>
					</div>
				</header>
				<div className="flex-1 overflow-auto">{children}</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
