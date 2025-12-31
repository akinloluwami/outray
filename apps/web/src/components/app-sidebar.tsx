import { useState, useEffect } from "react";
import { useParams } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Network,
  Settings,
  History,
  Globe,
  PanelLeftClose,
  PanelLeftOpen,
  Link2,
  CreditCard,
  Users,
  Key,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { authClient, usePermission } from "@/lib/auth-client";
import { appClient } from "@/lib/app-client";
import { NavItem } from "./sidebar/nav-item";
import { OrganizationDropdown } from "./sidebar/organization-dropdown";
import { PlanUsage } from "./sidebar/plan-usage";
import { UserSection } from "./sidebar/user-section";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { getPlanLimits } from "@/lib/subscription-plans";

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export function Sidebar({ isCollapsed, setIsCollapsed }: SidebarProps) {
  const { setSelectedOrganization } = useAppStore();
  const { data: organizations = [] } = authClient.useListOrganizations();
  const [isOrgDropdownOpen, setIsOrgDropdownOpen] = useState(false);
  const [activeTunnelsCount, setActiveTunnelsCount] = useState<number>(0);
  const { orgSlug } = useParams({ from: "/$orgSlug" });

  const selectedOrg =
    organizations?.find((org) => org.slug === orgSlug) || organizations?.[0];

  const selectedOrganization = selectedOrg
    ? {
        id: selectedOrg.id,
        name: selectedOrg.name,
        slug: selectedOrg.slug,
      }
    : null;

  const selectedOrganizationId = selectedOrganization?.id;

  const { data: session } = authClient.useSession();
  const user = session?.user;

  const { data: subscriptionData } = useQuery({
    queryKey: ["subscription", selectedOrganizationId],
    queryFn: async () => {
      if (!selectedOrganizationId) return null;
      const response = await axios.get(
        `/api/subscriptions/${selectedOrganizationId}`,
      );
      return response.data;
    },
    enabled: !!selectedOrganizationId,
  });

  const subscription = subscriptionData?.subscription;
  const currentPlan = subscription?.plan || "free";
  const planLimits = getPlanLimits(currentPlan as any);
  const tunnelLimit = planLimits.maxTunnels;

  useEffect(() => {
    const fetchStats = async () => {
      if (selectedOrganizationId) {
        const response = await appClient.stats.overview(selectedOrganizationId);
        if (response && "activeTunnels" in response) {
          setActiveTunnelsCount(response.activeTunnels || 0);
        }
      }
    };
    fetchStats();
  }, [selectedOrganizationId]);

  const { data: canManageBilling } = usePermission({
    billing: ["manage"],
  });

  const NAV_ICON_SIZE = 14;

  const navSections = [
    {
      title: "Platform",
      items: [
        {
          to: "/$orgSlug",
          label: "Overview",
          icon: <LayoutDashboard size={NAV_ICON_SIZE} />,
          activeOptions: { exact: true },
        },
        {
          to: "/$orgSlug/tunnels",
          label: "Active Tunnels",
          icon: <Network size={NAV_ICON_SIZE} />,
        },
        {
          to: "/$orgSlug/requests",
          label: "Requests",
          icon: <History size={NAV_ICON_SIZE} />,
        },
        {
          to: "/$orgSlug/subdomains",
          label: "Subdomains",
          icon: <Globe size={NAV_ICON_SIZE} />,
        },
        {
          to: "/$orgSlug/domains",
          label: "Domains",
          icon: <Link2 size={NAV_ICON_SIZE} />,
        },
      ],
    },
    {
      title: "Organization",
      items: [
        canManageBilling && {
          to: "/$orgSlug/billing",
          label: "Billing",
          icon: <CreditCard size={NAV_ICON_SIZE} />,
        },
        {
          to: "/$orgSlug/members",
          label: "Members",
          icon: <Users size={NAV_ICON_SIZE} />,
        },
      ].filter((item) => item !== false && item !== undefined) as any[],
    },
    {
      title: "Configuration",
      items: [
        {
          to: "/$orgSlug/settings",
          label: "Settings",
          icon: <Settings size={NAV_ICON_SIZE} />,
        },
        {
          to: "/$orgSlug/tokens",
          label: "API Tokens",
          icon: <Key size={NAV_ICON_SIZE} />,
        },
      ],
    },
  ];

  return (
    <div
      className={`${isCollapsed ? "w-15" : "w-56"} flex flex-col transition-all duration-300 ease-in-out bg-[#070707]`}
    >
      <div
        className={`p-4 flex items-center ${isCollapsed ? "justify-center" : "justify-between"}`}
      >
        {!isCollapsed && (
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-white/10">
              <div className="w-4 h-4 bg-black rounded-full" />
            </div>
            <p className="font-bold text-white text-lg tracking-tight">
              OutRay
            </p>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
        >
          {isCollapsed ? (
            <PanelLeftOpen size={20} />
          ) : (
            <PanelLeftClose size={20} />
          )}
        </button>
      </div>

      <OrganizationDropdown
        organizations={organizations!}
        selectedOrganization={selectedOrganization}
        setSelectedOrganization={setSelectedOrganization}
        isOrgDropdownOpen={isOrgDropdownOpen}
        setIsOrgDropdownOpen={setIsOrgDropdownOpen}
        isCollapsed={isCollapsed}
        selectedOrg={selectedOrg}
      />

      <div className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto scrollbar-hide">
        {navSections.map((section, idx) => (
          <div key={section.title} className={idx > 0 ? "mt-4" : ""}>
            {!isCollapsed && (
              <div className="px-4 mt-2 mb-2 text-[10px] font-bold text-gray-600 uppercase tracking-wider">
                {section.title}
              </div>
            )}
            {section.items.map((item) => (
              <NavItem
                key={item.to}
                to={item.to}
                icon={item.icon}
                label={item.label}
                activeOptions={item.activeOptions}
                isCollapsed={isCollapsed}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-white/5 space-y-2 bg-black/20">
        <PlanUsage
          activeTunnelsCount={activeTunnelsCount}
          isCollapsed={isCollapsed}
          limit={tunnelLimit}
          currentPlan={currentPlan}
        />

        <UserSection user={user} isCollapsed={isCollapsed} />
      </div>
    </div>
  );
}
