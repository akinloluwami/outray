import { createFileRoute } from "@tanstack/react-router";
import { CreditCard, Check, Zap, Crown, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAppStore } from "@/lib/store";
import {
  SUBSCRIPTION_PLANS,
  getPlanLimits,
  calculatePlanCost,
} from "@/lib/subscription-plans";
import { initiateCheckout, POLAR_PRODUCT_IDS } from "@/lib/polar";
import axios from "axios";
import { authClient, usePermission } from "@/lib/auth-client";
import { useState } from "react";
import { AlertModal } from "@/components/alert-modal";

export const Route = createFileRoute("/$orgSlug/billing")({
  component: BillingView,
  validateSearch: (search?: Record<string, unknown>): { success?: boolean } => {
    return {
      success:
        search?.success === "true" || search?.success === true
          ? true
          : undefined,
    };
  },
});

function BillingView() {
  const { selectedOrganization } = useAppStore();
  const selectedOrganizationId = selectedOrganization?.id;
  const { success } = Route.useSearch();
  const [alertState, setAlertState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "error" | "success" | "info";
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });

  const { data: canManageBilling, isPending: isCheckingPermission } =
    usePermission({
      billing: ["manage"],
    });

  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data } = await authClient.getSession();
      return data;
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["subscription", selectedOrganizationId],
    queryFn: async () => {
      const response = await axios.get(
        `/api/subscriptions/${selectedOrganizationId}`,
      );
      return response.data;
    },
    enabled: !!selectedOrganizationId && !!canManageBilling,
  });

  if (isCheckingPermission) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <Loader2 className="w-8 h-8 animate-spin text-white/20" />
      </div>
    );
  }

  if (!canManageBilling) {
    return (
      <div className="flex flex-col items-center justify-center min-h-100 text-center">
        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
          <CreditCard className="w-8 h-8 text-gray-500" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
        <p className="text-gray-400 max-w-md">
          You don't have permission to manage billing for this organization.
          Please contact an administrator if you need access.
        </p>
      </div>
    );
  }

  const subscription = data?.subscription;
  const currentPlan = subscription?.plan || "free";
  const planLimits = getPlanLimits(currentPlan as any);
  const monthlyCost = calculatePlanCost(currentPlan as any);

  const handleCheckout = async (plan: "ray" | "beam" | "pulse") => {
    if (!selectedOrganizationId || !session?.user) {
      setAlertState({
        isOpen: true,
        title: "Authentication Required",
        message: "Please sign in to upgrade your plan",
        type: "error",
      });
      return;
    }

    const productId = POLAR_PRODUCT_IDS[plan];
    if (!productId) {
      setAlertState({
        isOpen: true,
        title: "Configuration Error",
        message: "Product ID not configured. Please contact support.",
        type: "error",
      });
      return;
    }

    try {
      const checkoutUrl = await initiateCheckout(
        productId,
        selectedOrganizationId,
        session.user.email,
        session.user.name || session.user.email,
      );

      window.location.href = checkoutUrl;
    } catch (error) {
      console.error("Checkout error:", error);
      setAlertState({
        isOpen: true,
        title: "Checkout Failed",
        message: "Failed to initiate checkout. Please try again.",
        type: "error",
      });
    }
  };

  const handleManageSubscription = () => {
    if (!selectedOrganizationId) return;

    window.location.href = `/api/portal/polar?organizationId=${selectedOrganizationId}`;
  };

  return (
    <div className="max-w-6xl mx-auto">
      {success && (
        <div className="mb-6 bg-accent/10 border border-accent/20 rounded-xl p-4 flex items-center gap-3">
          <Check className="w-5 h-5 text-accent shrink-0" />
          <div>
            <p className="text-sm font-medium text-white">
              Subscription activated successfully!
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              Your plan has been upgraded and is now active.
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Billing & Subscription
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage your subscription and billing details
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      ) : (
        <>
          <div className="bg-white/2 border border-white/5 rounded-2xl overflow-hidden mb-8">
            <div className="p-6 border-b border-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent/10 rounded-lg">
                    <CreditCard className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white">
                      Current Plan:{" "}
                      {
                        SUBSCRIPTION_PLANS[
                          currentPlan as keyof typeof SUBSCRIPTION_PLANS
                        ].name
                      }
                    </h3>
                    <p className="text-sm text-gray-500">
                      {subscription?.status === "active"
                        ? "Active subscription"
                        : "No active subscription"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-white">
                    ${monthlyCost}
                  </p>
                  <p className="text-sm text-gray-500">/month</p>
                </div>
              </div>
              {currentPlan !== "free" && (
                <div className="mt-4">
                  <button
                    onClick={handleManageSubscription}
                    className="text-sm text-accent hover:text-accent/80 font-medium transition-colors"
                  >
                    Manage Subscription →
                  </button>
                </div>
              )}
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricBar
                label="Tunnels"
                value={data?.usage?.tunnels}
                limit={planLimits.maxTunnels}
              />
              <MetricBar
                label="Domains"
                value={data?.usage?.domains}
                limit={planLimits.maxDomains}
              />
              <MetricBar
                label="Subdomains"
                value={data?.usage?.subdomains}
                limit={planLimits.maxSubdomains}
              />
              <MetricBar
                label="Members"
                value={data?.usage?.members}
                limit={planLimits.maxMembers}
              />
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold text-white mb-6">
              Available Plans
            </h3>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              <PlanCard
                name="Free"
                price={0}
                icon={<Check className="w-6 h-6" />}
                description="For testing & experimenting"
                features={[
                  "1 Active Tunnel",
                  "1 Subdomain",
                  "1 Team Member",
                  "2GB Bandwidth",
                  "3 Days Retention",
                ]}
                current={currentPlan === "free"}
                onSelect={() => {}}
              />

              <PlanCard
                name="Ray"
                price={7}
                icon={<Zap className="w-6 h-6" />}
                description="For solo devs & tiny teams"
                features={[
                  "3 Active Tunnels",
                  "5 Subdomains",
                  "3 Team Members",
                  "1 Custom Domain",
                  "10GB Bandwidth",
                  "14 Days Retention",
                ]}
                current={currentPlan === "ray"}
                onSelect={() => handleCheckout("ray")}
              />

              <PlanCard
                name="Beam"
                price={15}
                icon={<Crown className="w-6 h-6" />}
                description="For teams shipping real things"
                features={[
                  "10 Active Tunnels",
                  "10 Subdomains",
                  "5 Team Members",
                  "Unlimited Custom Domains",
                  "50GB Bandwidth",
                  "30 Days Retention",
                  "Priority Support",
                ]}
                current={currentPlan === "beam"}
                recommended
                onSelect={() => handleCheckout("beam")}
              />

              <PlanCard
                name="Pulse"
                price={120}
                icon={<Zap className="w-6 h-6 text-purple-400" />}
                description="For high-scale production"
                features={[
                  "50 Active Tunnels",
                  "50 Subdomains",
                  "Unlimited Team Members",
                  "Unlimited Custom Domains",
                  "1TB Bandwidth",
                  "90 Days Retention",
                  "Priority Support",
                ]}
                current={currentPlan === "pulse"}
                onSelect={() => handleCheckout("pulse")}
              />
            </div>
          </div>
        </>
      )}

      <AlertModal
        isOpen={alertState.isOpen}
        onClose={() => setAlertState((prev) => ({ ...prev, isOpen: false }))}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
      />
    </div>
  );
}

function PlanCard({
  name,
  price,
  icon,
  description,
  features,
  current,
  recommended,
  extraInfo,
  onSelect,
}: {
  name: string;
  price: number;
  icon: React.ReactNode;
  description: string;
  features: string[];
  current?: boolean;
  recommended?: boolean;
  extraInfo?: string;
  onSelect: () => void;
}) {
  return (
    <div
      className={`bg-white/2 border rounded-2xl overflow-hidden ${
        recommended
          ? "border-accent shadow-lg shadow-accent/10 ring-2 ring-accent/20"
          : "border-white/5"
      }`}
    >
      {recommended && (
        <div className="bg-accent text-black text-xs font-bold text-center py-2 px-4">
          RECOMMENDED
        </div>
      )}
      <div className="p-6">
        <div className="flex items-center gap-3 mb-2">
          <div
            className={`p-2 rounded-lg ${recommended ? "bg-accent/10 text-accent" : "bg-white/5 text-gray-400"}`}
          >
            {icon}
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">{name}</h3>
            <p className="text-xs text-gray-500">{description}</p>
          </div>
        </div>

        <div className="flex items-baseline gap-1 mb-1 mt-4">
          <span className="text-4xl font-bold text-white">${price}</span>
          <span className="text-gray-500">/month</span>
        </div>
        {extraInfo && <p className="text-xs text-accent mb-4">{extraInfo}</p>}

        <ul className="space-y-2.5 mb-6 mt-6">
          {features.map((feature, index) => (
            <li
              key={index}
              className="flex items-start gap-2.5 text-sm text-gray-300"
            >
              <Check className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <button
          onClick={onSelect}
          disabled={current}
          className={`w-full py-2.5 rounded-xl font-medium transition-colors ${
            current
              ? "bg-white/10 text-gray-400 cursor-not-allowed"
              : recommended
                ? "bg-accent text-black hover:bg-accent/90"
                : "bg-white text-black hover:bg-gray-200"
          }`}
        >
          {current ? "Current Plan" : "Upgrade"}
        </button>
      </div>
    </div>
  );
}

function MetricBar({
  label,
  value,
  limit,
}: {
  label: string;
  value?: number;
  limit: number;
}) {
  const percentage =
    limit === -1 ? 0 : Math.min(100, Math.max(0, ((value || 0) / limit) * 100));

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500">{label}</span>
        <span className="text-xs font-medium text-white">
          {value ?? "-"} / {limit === -1 ? "∞" : limit}
        </span>
      </div>
      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full bg-accent transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
