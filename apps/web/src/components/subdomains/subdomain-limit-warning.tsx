import { Link, useParams } from "@tanstack/react-router";
import { AlertCircle } from "lucide-react";

interface SubdomainLimitWarningProps {
  isAtLimit: boolean;
  subdomainLimit: number;
  currentPlan: string;
}

export function SubdomainLimitWarning({
  isAtLimit,
  subdomainLimit,
  currentPlan,
}: SubdomainLimitWarningProps) {
  if (!isAtLimit) return null;

  const { orgSlug } = useParams({ from: "/$orgSlug" });

  return (
    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex items-start gap-3">
      <AlertCircle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-medium text-yellow-500">
          Subdomain limit reached
        </p>
        <p className="text-xs text-gray-400 mt-1">
          You've reached your plan's limit of {subdomainLimit} reserved
          subdomains.
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
              upgrade to Beam for up to 20 reserved subdomains or Pulse for
              unlimited subdomains.
            </>
          )}
          {currentPlan === "free" && (
            <> Upgrade to a paid plan to reserve more subdomains.</>
          )}
        </p>
      </div>
    </div>
  );
}
