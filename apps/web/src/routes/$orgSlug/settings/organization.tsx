import { createFileRoute } from "@tanstack/react-router";
import { Building2, Hash, Type } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/$orgSlug/settings/organization")({
  component: OrganizationSettingsView,
});

function OrganizationSettingsView() {
  const { selectedOrganization } = useAppStore();

  const { data: organizations } = authClient.useListOrganizations();

  const currentOrg = organizations?.find(
    (org) => org.id === selectedOrganization?.id,
  );

  if (!currentOrg) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Organization */}
      <div className="bg-white/2 border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <Building2 className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-white">Organization</h3>
              <p className="text-sm text-gray-500">
                Manage your organization settings
              </p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Organization Name
              </label>
              <div className="relative">
                <Type className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={currentOrg.name}
                  readOnly
                  className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-white/20 transition-colors cursor-not-allowed opacity-75"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Organization Slug
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={currentOrg.slug}
                  readOnly
                  className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-white/20 transition-colors cursor-not-allowed opacity-75"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
