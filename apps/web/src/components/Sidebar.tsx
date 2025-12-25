import { Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard,
  Network,
  Settings,
  HelpCircle,
  History,
  Globe,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  Check,
  Plus,
  Link2,
  CreditCard,
  Users,
  Activity,
} from "lucide-react";
import { useAppStore } from "../lib/store";
import { authClient } from "../lib/auth-client";
import { appClient } from "../lib/app-client";

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export function Sidebar({ isCollapsed, setIsCollapsed }: SidebarProps) {
  const { selectedOrganizationId, setSelectedOrganizationId } = useAppStore();
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [isOrgDropdownOpen, setIsOrgDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [activeTunnelsCount, setActiveTunnelsCount] = useState<number>(0);
  const navigate = useNavigate();

  const { data: session } = authClient.useSession();
  const user = session?.user;

  useEffect(() => {
    const fetchOrgs = async () => {
      const { data } = await authClient.organization.list();
      if (data) {
        setOrganizations(data);
        if (!selectedOrganizationId && data.length > 0) {
          const session = await authClient.getSession();
          const activeOrgId = session.data?.session.activeOrganizationId;
          setSelectedOrganizationId(activeOrgId || data[0].id);
        }
      }
    };
    fetchOrgs();
  }, []);

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOrgDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    await authClient.signOut();
    navigate({ to: "/login", search: { redirect: undefined } });
  };

  const selectedOrg =
    organizations.find((org) => org.id === selectedOrganizationId) ||
    organizations[0];

  return (
    <div
      className={`${isCollapsed ? "w-20" : "w-56"} flex flex-col transition-all duration-300 ease-in-out border-r border-white/5 bg-[#070707]`}
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

      <div className="px-4 py-2 relative" ref={dropdownRef}>
        <button
          onClick={() =>
            !isCollapsed && setIsOrgDropdownOpen(!isOrgDropdownOpen)
          }
          className={`w-full flex items-center ${isCollapsed ? "justify-center" : "justify-between"} px-3 py-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-sm text-gray-300 transition-all group hover:border-white/10 hover:shadow-lg hover:shadow-black/20 ${isOrgDropdownOpen ? "bg-white/10 border-white/10" : ""}`}
        >
          <span className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
              <div className="w-2 h-2 rounded-full bg-accent shadow-[0_0_8px_rgba(255,166,43,0.5)]" />
            </div>
            {!isCollapsed && (
              <span className="font-medium truncate max-w-30">
                {selectedOrg?.name || "Select Org"}
              </span>
            )}
          </span>
          {!isCollapsed && (
            <span
              className={`text-gray-500 group-hover:text-gray-400 transition-transform duration-200 ${isOrgDropdownOpen ? "-rotate-90" : "rotate-90"}`}
            >
              <ChevronRight size={14} />
            </span>
          )}
        </button>

        {isOrgDropdownOpen && !isCollapsed && (
          <div className="absolute top-full left-4 right-4 mt-2 bg-[#101010] border border-white/10 rounded-xl shadow-xl shadow-black/50 overflow-hidden z-50 backdrop-blur-xl">
            <div className="p-1 max-h-60 overflow-y-auto">
              {organizations.map((org) => (
                <button
                  key={org.id}
                  onClick={() => {
                    setSelectedOrganizationId(org.id);
                    setIsOrgDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedOrganizationId === org.id
                      ? "bg-accent/10 text-accent"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <span className="truncate">{org.name}</span>
                  {selectedOrganizationId === org.id && <Check size={14} />}
                </button>
              ))}
            </div>
            <div className="p-1 border-t border-white/5">
              <Link
                to="/onboarding"
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                onClick={() => setIsOrgDropdownOpen(false)}
              >
                <Plus size={14} />
                Create Organization
              </Link>
            </div>
          </div>
        )}
      </div>

      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto scrollbar-hide">
        {!isCollapsed && (
          <div className="px-4 mt-2 mb-2 text-[10px] font-bold text-gray-600 uppercase tracking-wider">
            Platform
          </div>
        )}
        <NavItem
          to="/dash"
          icon={<LayoutDashboard size={20} />}
          label="Overview"
          activeOptions={{ exact: true }}
          isCollapsed={isCollapsed}
        />
        <NavItem
          to="/dash/tunnels"
          icon={<Network size={20} />}
          label="Active Tunnels"
          isCollapsed={isCollapsed}
        />
        <NavItem
          to="/dash/requests"
          icon={<History size={20} />}
          label="Requests"
          isCollapsed={isCollapsed}
        />
        <NavItem
          to="/dash/subdomains"
          icon={<Globe size={20} />}
          label="Subdomains"
          isCollapsed={isCollapsed}
        />
        <NavItem
          to="/dash/domains"
          icon={<Link2 size={20} />}
          label="Domains"
          isCollapsed={isCollapsed}
        />

        {!isCollapsed && (
          <div className="px-4 mt-6 mb-2 text-[10px] font-bold text-gray-600 uppercase tracking-wider">
            Organization
          </div>
        )}
        <NavItem
          to="/dash/billing"
          icon={<CreditCard size={20} />}
          label="Billing"
          isCollapsed={isCollapsed}
        />
        <NavItem
          to="/dash/members"
          icon={<Users size={20} />}
          label="Members"
          isCollapsed={isCollapsed}
        />
        <NavItem
          to="/dash/activity"
          icon={<Activity size={20} />}
          label="Activity"
          isCollapsed={isCollapsed}
        />

        {!isCollapsed && (
          <div className="px-4 mt-6 mb-2 text-[10px] font-bold text-gray-600 uppercase tracking-wider">
            Configuration
          </div>
        )}
        <NavItem
          to="/dash/settings"
          icon={<Settings size={20} />}
          label="Settings"
          isCollapsed={isCollapsed}
        />
      </nav>

      <div className="p-3 border-t border-white/5 space-y-2 bg-black/20">
        {!isCollapsed && (
          <div className="px-3 py-2 bg-linear-to-br from-accent/10 to-transparent rounded-xl border border-accent/10 mb-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-accent">Free Plan</span>
              <span className="text-[10px] text-accent/70">
                {activeTunnelsCount}/5 Tunnels
              </span>
            </div>
            <div className="h-1.5 bg-accent/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full"
                style={{ width: `${(activeTunnelsCount / 5) * 100}%` }}
              />
            </div>
          </div>
        )}

        <button
          className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3"} w-full px-3 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors group`}
        >
          <HelpCircle size={20} />
          {!isCollapsed && <span>Help & Support</span>}
        </button>

        <div
          className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3"} px-2 py-2 mt-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group border border-transparent hover:border-white/5`}
        >
          <div className="w-9 h-9 rounded-full bg-linear-to-tr from-accent to-orange-600 flex items-center justify-center text-black font-bold text-xs shadow-lg shadow-accent/20 shrink-0">
            {user?.name?.substring(0, 2).toUpperCase() || "U"}
          </div>
          {!isCollapsed && (
            <>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate group-hover:text-accent transition-colors">
                  {user?.name || "User"}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {user?.email || "user@example.com"}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <LogOut size={16} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function NavItem({
  icon,
  label,
  to,
  activeOptions,
  isCollapsed,
}: {
  icon: React.ReactNode;
  label: string;
  to: string;
  activeOptions?: { exact: boolean };
  isCollapsed: boolean;
}) {
  return (
    <Link
      to={to}
      activeProps={{
        className:
          "bg-accent/10 text-accent font-medium border border-accent/20 shadow-[0_0_15px_rgba(255,166,43,0.1)]",
      }}
      inactiveProps={{
        className:
          "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent",
      }}
      activeOptions={activeOptions}
      className={`flex items-center ${isCollapsed ? "justify-center px-2" : "gap-3 px-3"} w-full py-2 text-sm rounded-xl transition-all duration-200 group relative`}
    >
      {icon}
      {!isCollapsed && <span>{label}</span>}
      {isCollapsed && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 border border-white/10">
          {label}
        </div>
      )}
    </Link>
  );
}
