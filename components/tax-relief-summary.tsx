"use client";

import { AlertTriangle } from "lucide-react";
import type { TaxReliefSummaryItem } from "@/lib/utils/tax-reliefs";
import { Progress } from "./ui/progress";

interface Props {
	items: TaxReliefSummaryItem[];
}

export function TaxReliefSummary({ items }: Props) {
	const totalClaimable = items.reduce((sum, i) => sum + i.claimable, 0);

	return (
		<div className="flex flex-col gap-4">
			{items.map((item) => (
				<div key={item.code} className="flex flex-col gap-1">
					<div className="flex items-center justify-between text-sm">
						<span className="font-medium">{item.name}</span>
						<span>
							RM {item.used.toLocaleString()} / {item.limit.toLocaleString()}
						</span>
					</div>
					<Progress
						value={item.percentage}
						className={item.exceeded ? "[&>[data-slot=progress-indicator]]:bg-destructive" : ""}
					/>
					{item.exceeded && (
						<p className="flex items-center gap-1 text-xs text-destructive">
							<AlertTriangle className="size-3" />
							上限超過: RM {(item.used - item.limit).toLocaleString()} 超過
						</p>
					)}
				</div>
			))}
			<div className="rounded-lg border bg-muted/30 p-4">
				<p className="text-sm font-medium">Form B 控除額合計</p>
				<p className="text-2xl font-bold">RM {totalClaimable.toLocaleString()}</p>
			</div>
		</div>
	);
}
