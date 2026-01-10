import { X, Key, Copy, Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { appClient } from "@/lib/app-client";

interface CreateTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateTokenModal({ isOpen, onClose }: CreateTokenModalProps) {
  const queryClient = useQueryClient();
  const [newTokenName, setNewTokenName] = useState("");
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);
  const { orgSlug } = useParams({ from: "/api/$orgSlug/auth-tokens" });

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await appClient.authTokens.create({
        name,
        orgSlug,
      });

      if ("error" in response) {
        throw new Error(response.error);
      }

      return response.token.token;
    },
    onSuccess: (token) => {
      if (token) {
        setCreatedToken(token);
      }
      setNewTokenName("");
      queryClient.invalidateQueries({
        queryKey: ["auth-tokens", orgSlug],
      });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTokenName.trim()) return;
    createMutation.mutate(newTokenName);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const handleClose = () => {
    setCreatedToken(null);
    setNewTokenName("");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-2xl overflow-hidden pointer-events-auto"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                    <Key size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">
                      Generate API Token
                    </h2>
                    <p className="text-sm text-gray-500">
                      Create a new token for CLI access
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6">
                {!createdToken ? (
                  <form onSubmit={handleCreate} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Token Name
                      </label>
                      <input
                        type="text"
                        value={newTokenName}
                        onChange={(e) => setNewTokenName(e.target.value)}
                        placeholder="e.g. CI/CD Pipeline"
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-white/20 transition-colors"
                        autoFocus
                      />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={handleClose}
                        className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={
                          createMutation.isPending || !newTokenName.trim()
                        }
                        className="px-4 py-2 bg-white text-black rounded-xl font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {createMutation.isPending && (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        )}
                        Generate Token
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-start gap-3">
                      <div className="p-1 bg-green-500/20 rounded-full shrink-0 mt-0.5">
                        <Check className="w-4 h-4 text-green-500" />
                      </div>
                      <div>
                        <h4 className="text-green-500 font-medium text-sm">
                          Token Generated Successfully
                        </h4>
                        <p className="text-xs text-green-500/80 mt-1">
                          Make sure to copy your token now. You won't be able to
                          see it again!
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Your API Token
                      </label>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-white break-all">
                          {createdToken}
                        </code>
                        <button
                          onClick={() => copyToClipboard(createdToken)}
                          className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-colors"
                        >
                          {copiedToken ? (
                            <Check size={18} className="text-green-500" />
                          ) : (
                            <Copy size={18} />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={handleClose}
                        className="px-4 py-2 bg-white text-black rounded-xl font-medium hover:bg-gray-200 transition-colors"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
