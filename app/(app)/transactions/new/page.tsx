import { redirect } from "next/navigation";
import { TransactionForm } from "@/components/transaction-form";
import { getUser } from "@/lib/auth";

export default async function NewTransactionPage() {
	const user = await getUser();
	if (!user) redirect("/login");

	return (
		<div className="flex flex-col gap-6 p-4 md:p-6">
			<TransactionForm />
		</div>
	);
}
