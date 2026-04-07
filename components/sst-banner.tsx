import { AlertTriangle, Info } from "lucide-react";
import type { SstAlertLevel, SstStatus } from "@/app/_actions/sst-actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SST_THRESHOLDS } from "@/lib/utils/constants";

const ALERT_CONFIG: Record<
	Exclude<SstAlertLevel, "none">,
	{ className: string; icon: typeof AlertTriangle }
> = {
	yellow: {
		className: "border-yellow-500 bg-yellow-50 text-yellow-900",
		icon: Info,
	},
	red: {
		className: "border-red-500 bg-red-50 text-red-900",
		icon: AlertTriangle,
	},
};

function formatRM(amount: number): string {
	return `RM${amount.toLocaleString()}`;
}

export function SstBanner({ data }: { data: SstStatus }) {
	if (data.alertLevel === "none") return null;

	const config = ALERT_CONFIG[data.alertLevel];
	const Icon = config.icon;
	const remaining = SST_THRESHOLDS.REGISTRATION_REQUIRED - data.taxableTotal;

	return (
		<Alert className={config.className} data-testid="sst-banner">
			<Icon className="h-4 w-4" />
			<AlertTitle>
				{data.registrationRequired ? "SST登録が必要です" : "SST登録閾値に近づいています"}
			</AlertTitle>
			<AlertDescription>
				<p>
					12ヶ月累計課税売上: {formatRM(data.taxableTotal)} /{" "}
					{formatRM(SST_THRESHOLDS.REGISTRATION_REQUIRED)}
				</p>
				{data.registrationRequired ? (
					<p className="mt-1 font-medium">
						課税売上がRM50万を超えました。RMCD（マレーシア関税局）にSST登録を申請してください。
					</p>
				) : (
					<p>あと {formatRM(remaining)} で登録義務が発生します。</p>
				)}
			</AlertDescription>
		</Alert>
	);
}
