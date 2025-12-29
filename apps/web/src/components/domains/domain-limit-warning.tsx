import { useParams } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { AlertCircle } from "lucide-react";

interface DomainLimitWarningProps {
  isAtLimit: boolean;
  domainLimit: number;
  currentPlan: string;
}

export function DomainLimitWarning({
  isAtLimit,
  domainLimit,
  currentPlan,
}: DomainLimitWarningProps) {
  if (!isAtLimit) return null;

  const { orgSlug } = useParams({ from: "/$orgSlug" });

  return (
    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex items-start gap-3">
      <AlertCircle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-medium text-yellow-500">
          Domain limit reached
        </p>
        <p className="text-xs text-gray-400 mt-1">
          You've reached your plan's limit of {domainLimit} custom domains.
          {currentPlan === "ray" && (
            <>
              {" "}
              Go to{" "}
              <Link
                to="/$orgSlug/billing"
                className="text-yellow-500 hover:underline"
                params={{ orgSlug }}
                search={{ success: false }}
              >
                Billing
              </Link>{" "}
              upgrade to Beam for up to 10 custom domains or Pulse for unlimited
              domains.
            </>
          )}
          {currentPlan === "free" && (
            <> Upgrade to a paid plan to add custom domains.</>
          )}
        </p>
      </div>
    </div>
  );
}
