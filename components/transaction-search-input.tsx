"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function TransactionSearchInput() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [value, setValue] = useState(searchParams.get("search") ?? "");

	function handleSearch() {
		const params = new URLSearchParams(searchParams.toString());
		if (value.trim()) {
			params.set("search", value.trim());
		} else {
			params.delete("search");
		}
		params.set("page", "1");
		router.push(`?${params.toString()}`);
	}

	return (
		<div className="flex gap-2">
			<Input
				placeholder="摘要で検索..."
				value={value}
				onChange={(e) => setValue(e.target.value)}
				onKeyDown={(e) => {
					if (e.key === "Enter") handleSearch();
				}}
				className="max-w-sm"
			/>
			<Button variant="outline" size="sm" onClick={handleSearch} aria-label="検索">
				<Search className="size-4" />
			</Button>
		</div>
	);
}
