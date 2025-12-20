import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Globe, Plus, Trash2, X } from "lucide-react";
import { appClient } from "../../lib/app-client";
import { useAppStore } from "../../lib/store";

export const Route = createFileRoute("/dash/subdomains")({
  component: SubdomainsView,
});

function SubdomainsView() {
  const { selectedOrganizationId } = useAppStore();
  const activeOrgId = selectedOrganizationId;
  const queryClient = useQueryClient();
  const [newSubdomain, setNewSubdomain] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["subdomains", activeOrgId],
    queryFn: () => {
      if (!activeOrgId) throw new Error("No active organization");
      return appClient.subdomains.list(activeOrgId);
    },
    enabled: !!activeOrgId,
  });

  const createMutation = useMutation({
    mutationFn: async (subdomain: string) => {
      if (!activeOrgId) throw new Error("No active organization");
      return appClient.subdomains.create({
        subdomain,
        organizationId: activeOrgId,
      });
    },
    onSuccess: (data) => {
      if ("error" in data) {
        setError(data.error);
      } else {
        setNewSubdomain("");
        setIsCreating(false);
        queryClient.invalidateQueries({ queryKey: ["subdomains"] });
      }
    },
    onError: () => {
      setError("Failed to create subdomain");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return appClient.subdomains.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subdomains"] });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    createMutation.mutate(newSubdomain);
  };

  const subdomains = data && "subdomains" in data ? data.subdomains : [];

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-48 bg-white/5 rounded mb-2" />
            <div className="h-4 w-64 bg-white/5 rounded" />
          </div>
          <div className="h-10 w-40 bg-white/5 rounded-lg" />
        </div>

        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between bg-white/2 border border-white/5 rounded-2xl p-6"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white/5" />
                <div>
                  <div className="h-4 w-48 bg-white/5 rounded mb-2" />
                  <div className="h-3 w-32 bg-white/5 rounded" />
                </div>
              </div>
              <div className="h-8 w-8 bg-white/5 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Subdomains</h1>
          <p className="text-gray-400 mt-1">
            Reserve subdomains for your tunnels.
          </p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-200 text-black rounded-full transition-colors font-medium"
        >
          <Plus size={16} />
          Reserve Subdomain
        </button>
      </div>

      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">
                Reserve Subdomain
              </h2>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setError(null);
                  setNewSubdomain("");
                }}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">
                  Subdomain
                </label>
                <div className="flex items-center">
                  <input
                    type="text"
                    value={newSubdomain}
                    onChange={(e) => setNewSubdomain(e.target.value)}
                    placeholder="my-app"
                    className="flex-1 bg-white/5 border border-white/10 rounded-l-xl px-4 py-2.5 text-white focus:outline-none focus:border-accent/50 focus:bg-white/10 transition-all"
                    autoFocus
                  />
                  <div className="bg-white/5 border border-l-0 border-white/10 rounded-r-xl px-4 py-2.5 text-gray-400">
                    .outray.app
                  </div>
                </div>
                {error && <p className="text-red-400 mt-2 text-sm">{error}</p>}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setError(null);
                    setNewSubdomain("");
                  }}
                  className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex-1 px-4 py-2.5 bg-white hover:bg-gray-200 text-black rounded-xl transition-colors disabled:opacity-50 font-medium"
                >
                  {createMutation.isPending ? "Reserving..." : "Reserve"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {subdomains.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-white/2 rounded-2xl border border-white/5">
          No subdomains reserved yet.
        </div>
      ) : (
        <div className="grid gap-4">
          {subdomains.map((sub) => (
            <div
              key={sub.id}
              className="flex items-center justify-between bg-white/2 border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20">
                  <Globe size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-white">
                      {sub.subdomain}.outray.app
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-xs border border-green-500/20">
                      Reserved
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Created on {new Date(sub.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (
                    confirm("Are you sure you want to release this subdomain?")
                  ) {
                    deleteMutation.mutate(sub.id);
                  }
                }}
                className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
