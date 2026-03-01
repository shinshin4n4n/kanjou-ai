import { redirect } from "next/navigation";
import { getTransaction } from "@/app/_actions/transaction-actions";
import { TransactionForm } from "@/components/transaction-form";
import { getUser } from "@/lib/auth";

interface PageProps {
	params: Promise<{ id: string }>;
}

export default async function EditTransactionPage({ params }: PageProps) {
	const user = await getUser();
	if (!user) redirect("/login");

	const { id } = await params;
	const result = await getTransaction(id);

	if (!result.success) {
		return (
			<div className="flex flex-col gap-6 p-4 md:p-6">
				<p className="text-sm text-destructive">{result.error}</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-6 p-4 md:p-6">
			<TransactionForm transaction={result.data} />
		</div>
	);
}
