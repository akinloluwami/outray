import { X, AlertTriangle } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Link } from "@tanstack/react-router";
import { useAppStore } from "@/lib/store";

interface LimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  limit: number;
  currentPlan: string;
  resourceName: string;
}

export function LimitModal({
  isOpen,
  onClose,
  title,
  description,
  limit,
  currentPlan,
  resourceName,
}: LimitModalProps) {
  const { selectedOrganization } = useAppStore();
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-2xl overflow-hidden pointer-events-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
                      <AlertTriangle className="w-5 h-5 text-yellow-500" />
                    </div>
                    <h2 className="text-lg font-semibold text-white">
                      {title}
                    </h2>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <p className="text-gray-400 text-sm leading-relaxed">
                    {description}
                  </p>

                  <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-400">
                        Current Plan
                      </span>
                      <span className="text-sm font-medium text-white capitalize">
                        {currentPlan}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">
                        {resourceName} Limit
                      </span>
                      <span className="text-sm font-medium text-white">
                        {limit}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={onClose}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-colors border border-white/5"
                    >
                      Cancel
                    </button>
                    <Link
                      to="/$orgSlug/billing"
                      params={{ orgSlug: selectedOrganization?.slug! }}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-white text-black text-sm font-medium hover:bg-gray-100 transition-colors text-center"
                    >
                      Upgrade Plan
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
