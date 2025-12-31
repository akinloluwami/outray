import { createFileRoute } from "@tanstack/react-router";
import { Key, Plus, Trash2 } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Loader2 } from "lucide-react";
import { CreateTokenModal } from "@/components/create-token-modal";
import { ConfirmModal } from "@/components/confirm-modal";

export const Route = createFileRoute("/$orgSlug/tokens")({
  component: TokensSettingsView,
});

interface AuthToken {
  id: string;
  name: string;
  lastUsedAt: string | null;
  createdAt: string;
  token?: string; // Only present when just created
}

function TokensSettingsView() {
  const { selectedOrganization } = useAppStore();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [tokenToDelete, setTokenToDelete] = useState<string | null>(null);

  const { data: tokens, isLoading } = useQuery({
    queryKey: ["auth-tokens", selectedOrganization?.id],
    queryFn: async () => {
      if (!selectedOrganization?.id) return [];
      const response = await axios.get(
        `/api/auth-tokens?organizationId=${selectedOrganization.id}`,
      );
      return response.data.tokens as AuthToken[];
    },
    enabled: !!selectedOrganization?.id,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete("/api/auth-tokens", {
        data: { id, organizationId: selectedOrganization?.id },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["auth-tokens", selectedOrganization?.id],
      });
      setTokenToDelete(null);
    },
  });

  if (!selectedOrganization) return null;

  return (
    <div className="space-y-6">
      <div className="bg-white/2 border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <Key className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-white">API Tokens</h3>
                <p className="text-sm text-gray-500">
                  Manage access tokens for the CLI and API
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              <Plus size={16} />
              New Token
            </button>
          </div>
        </div>

        <CreateTokenModal
          isOpen={isCreating}
          onClose={() => setIsCreating(false)}
        />

        <ConfirmModal
          isOpen={!!tokenToDelete}
          onClose={() => setTokenToDelete(null)}
          onConfirm={() => {
            if (tokenToDelete) {
              deleteMutation.mutate(tokenToDelete);
            }
          }}
          title="Delete API Token"
          message="Are you sure you want to delete this token? This action cannot be undone and any applications using this token will stop working."
          confirmText="Delete Token"
          isDestructive
        />

        <div className="p-6">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-white/20" />
            </div>
          ) : tokens?.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No API tokens found. Generate one to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {tokens?.map((token) => (
                <div
                  key={token.id}
                  className="flex items-center justify-between p-4 bg-white/2 border border-white/5 rounded-xl hover:border-white/10 transition-colors"
                >
                  <div>
                    <h4 className="text-white font-medium">{token.name}</h4>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                      <span>
                        Created{" "}
                        {formatDistanceToNow(new Date(token.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                      <span>•</span>
                      <span>
                        {token.lastUsedAt
                          ? `Last used ${formatDistanceToNow(
                              new Date(token.lastUsedAt),
                              { addSuffix: true },
                            )}`
                          : "Never used"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="font-mono text-xs text-gray-600">
                      outray_...
                    </div>
                    <button
                      onClick={() => setTokenToDelete(token.id)}
                      disabled={deleteMutation.isPending}
                      className="p-2 hover:bg-red-500/10 text-gray-500 hover:text-red-400 rounded-lg transition-colors"
                    >
                      {deleteMutation.isPending &&
                      tokenToDelete === token.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 size={18} />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
