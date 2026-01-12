import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Search, Building2, Users, Network } from "lucide-react";
import { appClient } from "@/lib/app-client";
import { AdminDataTable, type Column } from "@/components/admin/admin-data-table";
import { UsersSkeleton } from "@/components/admin/admin-skeleton";
import { useAdminStore } from "@/lib/admin-store";

export const Route = createFileRoute("/admin/organizations")({
  component: AdminOrganizationsPage,
});

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  createdAt: Date;
  memberCount: number;
  activeTunnels: number;
  subscription: { plan: string; status: string };
}

const planColors: Record<string, string> = {
  free: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  ray: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  beam: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  pulse: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

function AdminOrganizationsPage() {
  const token = useAdminStore((s) => s.token);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    if (!token) return;

    const fetchOrgs = async () => {
      setIsLoading(true);
      const res = await appClient.admin.organizations(token, { page, search });
      if ("error" in res) {
        console.error("Failed to fetch organizations:", res.error);
        setIsLoading(false);
        setInitialLoad(false);
        return;
      }
      setOrganizations(res.organizations);
      setTotalPages(res.totalPages);
      setTotal(res.total);
      setIsLoading(false);
      setInitialLoad(false);
    };

    fetchOrgs();
  }, [token, page, search]);

  if (!token || initialLoad) {
    return <UsersSkeleton />;
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const columns: Column<Organization>[] = [
    {
      key: "name",
      header: "Organization",
      render: (org) => (
        <div className="flex items-center gap-3">
          {org.logo ? (
            <img
              src={org.logo}
              alt={org.name}
              className="w-8 h-8 rounded-lg"
            />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <Building2 size={14} className="text-gray-400" />
            </div>
          )}
          <div>
            <div className="font-medium text-white">{org.name}</div>
            <div className="text-xs text-gray-500">/{org.slug}</div>
          </div>
        </div>
      ),
    },
    {
      key: "subscription",
      header: "Plan",
      render: (org) => (
        <span
          className={`px-2 py-1 rounded-lg text-xs font-medium border capitalize ${
            planColors[org.subscription.plan] || planColors.free
          }`}
        >
          {org.subscription.plan}
        </span>
      ),
    },
    {
      key: "memberCount",
      header: "Members",
      render: (org) => (
        <div className="flex items-center gap-2 text-gray-400">
          <Users size={14} />
          {org.memberCount}
        </div>
      ),
    },
    {
      key: "activeTunnels",
      header: "Active Tunnels",
      render: (org) => (
        <div className="flex items-center gap-2">
          <Network size={14} className={org.activeTunnels > 0 ? "text-green-400" : "text-gray-500"} />
          <span className={org.activeTunnels > 0 ? "text-green-400" : "text-gray-400"}>
            {org.activeTunnels}
          </span>
        </div>
      ),
    },
    {
      key: "createdAt",
      header: "Created",
      render: (org) => (
        <span className="text-gray-400">{formatDate(org.createdAt)}</span>
      ),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Organizations
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {total.toLocaleString()} total organizations
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            />
            <input
              type="text"
              placeholder="Search by name or slug..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-white/20 w-64"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-white/10 text-white rounded-xl text-sm font-medium hover:bg-white/20 transition-all"
          >
            Search
          </button>
        </form>
      </div>

      <AdminDataTable
        columns={columns}
        data={organizations}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        isLoading={isLoading}
        emptyMessage="No organizations found"
      />
    </div>
  );
}
