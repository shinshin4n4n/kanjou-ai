import { redirect } from "next/navigation";
import { getTaxReliefs } from "@/app/_actions/tax-relief-actions";
import { TaxReliefList } from "@/components/tax-relief-list";
import { getUser } from "@/lib/auth";
import { ASSESSMENT_YEARS } from "@/lib/utils/tax-reliefs";

interface PageProps {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function TaxReliefsPage({ searchParams }: PageProps) {
	const user = await getUser();
	if (!user) redirect("/login");

	const raw = await searchParams;
	const yearParam = Array.isArray(raw.year) ? raw.year[0] : raw.year;
	const assessmentYear = ASSESSMENT_YEARS.includes(yearParam as "2024" | "2025")
		? (yearParam as string)
		: (ASSESSMENT_YEARS[0] ?? "2024");

	const result = await getTaxReliefs({ assessment_year: assessmentYear });

	if (!result.success) {
		return (
			<div className="flex flex-col gap-6 p-4 md:p-6">
				<h1 className="text-xl font-bold tracking-tight">控除記録</h1>
				<p className="text-sm text-destructive">{result.error}</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-6 p-4 md:p-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-xl font-bold tracking-tight">控除記録</h1>
					<p className="text-sm text-muted-foreground">
						YA {assessmentYear} - {result.data.length}件の記録
					</p>
				</div>
				<div className="flex gap-2">
					{ASSESSMENT_YEARS.map((ya) => (
						<a
							key={ya}
							href={`/tax-reliefs?year=${ya}`}
							className={`rounded-md border px-3 py-1.5 text-sm ${
								ya === assessmentYear ? "bg-primary text-primary-foreground" : "hover:bg-accent"
							}`}
						>
							YA {ya}
						</a>
					))}
				</div>
			</div>

			<TaxReliefList records={result.data} assessmentYear={assessmentYear} />
		</div>
	);
}
