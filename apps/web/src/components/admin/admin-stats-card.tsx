import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";

interface AdminStatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: ReactNode;
  subtitle?: string;
}

export function AdminStatsCard({
  title,
  value,
  change,
  icon,
  subtitle,
}: AdminStatsCardProps) {
  const isPositive = change !== undefined && change >= 0;
  const changeColor = isPositive
    ? "text-green-400 bg-green-500/10 border-green-500/20"
    : "text-red-400 bg-red-500/10 border-red-500/20";

  return (
    <div className="group bg-white/2 border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-300 border border-white/5 group-hover:border-accent/20 group-hover:text-accent transition-colors">
          {icon}
        </div>
        {change !== undefined && (
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-medium ${changeColor}`}
          >
            {isPositive ? (
              <ArrowUpRight size={12} />
            ) : (
              <ArrowDownRight size={12} />
            )}
            {isPositive ? "+" : ""}
            {change.toFixed(1)}%
          </div>
        )}
      </div>

      <div className="text-3xl font-bold text-white mb-1 tracking-tight">
        {value}
      </div>
      <div className="flex items-center gap-2">
        <div className="text-xs text-gray-500 uppercase tracking-wider font-medium">
          {title}
        </div>
        {subtitle && (
          <>
            <span className="text-gray-700">•</span>
            <span className="text-xs text-gray-500">{subtitle}</span>
          </>
        )}
      </div>
    </div>
  );
}
