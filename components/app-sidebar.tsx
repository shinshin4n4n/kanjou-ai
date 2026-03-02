"use client";

import { BookOpen, LayoutDashboard, List, LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "@/app/_actions/auth";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarSeparator,
} from "@/components/ui/sidebar";

const navItems = [
	{
		label: "ダッシュボード",
		href: "/dashboard",
		icon: LayoutDashboard,
	},
	{
		label: "取引一覧",
		href: "/transactions",
		icon: List,
	},
	{
		label: "設定",
		href: "/settings",
		icon: Settings,
	},
];

export function AppSidebar() {
	const pathname = usePathname();
	const router = useRouter();

	async function handleSignOut() {
		await signOut();
		router.push("/login");
	}

	return (
		<Sidebar collapsible="icon">
			<SidebarHeader className="p-4">
				<Link href="/dashboard" className="flex items-center gap-2">
					<div className="flex size-8 items-center justify-center rounded-md bg-sidebar-primary">
						<BookOpen className="size-4 text-sidebar-primary-foreground" />
					</div>
					<div className="flex flex-col group-data-[collapsible=icon]:hidden">
						<span className="text-sm font-bold tracking-tight text-sidebar-foreground">
							KanjouAI
						</span>
						<span className="text-[10px] text-sidebar-foreground/60">AI仕訳管理</span>
					</div>
				</Link>
			</SidebarHeader>
			<SidebarSeparator />
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>メニュー</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{navItems.map((item) => (
								<SidebarMenuItem key={item.href}>
									<SidebarMenuButton
										asChild
										isActive={pathname.startsWith(item.href)}
										tooltip={item.label}
									>
										<Link href={item.href}>
											<item.icon className="size-4" />
											<span>{item.label}</span>
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton tooltip="ログアウト" onClick={handleSignOut}>
							<LogOut className="size-4" />
							<span>ログアウト</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>
		</Sidebar>
	);
}
