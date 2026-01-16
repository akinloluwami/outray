import { createFileRoute } from "@tanstack/react-router";
import { Building2, Hash, Type, Database, Shield } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useFeatureFlag } from "@/lib/feature-flags";

export const Route = createFileRoute("/$orgSlug/settings/organization")({
  component: OrganizationSettingsView,
});

function OrganizationSettingsView() {
  const { orgSlug } = Route.useParams();
  const [fullCaptureEnabled, setFullCaptureEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const { data: organizations } = authClient.useListOrganizations();
  const isFullCaptureFeatureEnabled = useFeatureFlag("full_capture");

  const currentOrg = organizations?.find((org) => org.slug === orgSlug);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch(`/api/${orgSlug}/settings`);
        if (response.ok) {
          const data = await response.json();
          setFullCaptureEnabled(data.fullCaptureEnabled);
        }
      } catch (error) {
        console.error("Failed to fetch settings:", error);
      } finally {
        setLoading(false);
      }
    };

    if (orgSlug) {
      fetchSettings();
    }
  }, [orgSlug]);

  const handleFullCaptureToggle = async (enabled: boolean) => {
    setUpdating(true);
    try {
      const response = await fetch(`/api/${orgSlug}/settings`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fullCaptureEnabled: enabled }),
      });

      if (response.ok) {
        setFullCaptureEnabled(enabled);
        toast.success(
          enabled
            ? "Full request capture enabled"
            : "Full request capture disabled",
        );
      } else {
        throw new Error("Failed to update settings");
      }
    } catch (error) {
      console.error("Failed to update settings:", error);
      toast.error("Failed to update settings");
    } finally {
      setUpdating(false);
    }
  };

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

      {/* Request Capture Settings */}
      {isFullCaptureFeatureEnabled && (
        <div className="bg-white/2 border border-white/5 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Database className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-white">
                  Request Capture
                </h3>
                <p className="text-sm text-gray-500">
                  Configure request and response data capture
                </p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-amber-400" />
                  <h4 className="text-sm font-medium text-white">
                    Full Request Capture
                  </h4>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  When enabled, we'll capture and store complete request and
                  response data including headers and body content. This allows
                  for detailed request inspection and replay functionality.
                </p>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                  <p className="text-xs text-amber-300">
                    <strong>Privacy Notice:</strong> Enabling this feature will
                    store request/response bodies which may contain sensitive
                    data. Only enable if you consent to storing this traffic
                    data.
                  </p>
                </div>
              </div>
              <div className="ml-6">
                {loading ? (
                  <div className="w-14 h-7 bg-white/10 rounded-full animate-pulse" />
                ) : (
                  <button
                    onClick={() => handleFullCaptureToggle(!fullCaptureEnabled)}
                    disabled={updating}
                    className={`relative inline-flex h-7 w-14 items-center rounded-full border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                      fullCaptureEnabled
                        ? "border-accent bg-accent/15"
                        : "border-white/20 bg-white/5"
                    } ${updating ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full shadow-lg transition-all duration-200 ${
                        fullCaptureEnabled
                          ? "translate-x-8 bg-accent"
                          : "translate-x-1 bg-white/40"
                      }`}
                    />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
