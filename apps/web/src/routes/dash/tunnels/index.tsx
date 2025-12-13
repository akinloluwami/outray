import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Globe,
  Copy,
  Terminal,
  MoreVertical,
  Filter,
  ArrowUpDown,
  LayoutGrid,
  List,
  Search,
} from "lucide-react";

export const Route = createFileRoute("/dash/tunnels/")({
  component: TunnelsView,
});

function TunnelsView() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            size={16}
          />
          <input
            type="text"
            placeholder="Search tunnels by name, description or key"
            className="w-full bg-black border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-2 bg-black border border-white/10 rounded-lg text-sm text-gray-300 hover:text-white hover:border-white/20 transition-colors">
            <Filter size={16} />
            Filters
          </button>
          <button className="flex items-center gap-2 px-3 py-2 bg-black border border-white/10 rounded-lg text-sm text-gray-300 hover:text-white hover:border-white/20 transition-colors">
            <ArrowUpDown size={16} />
            Sort
          </button>
          <div className="h-9 w-px bg-white/10 mx-1" />
          <div className="flex bg-black border border-white/10 rounded-lg p-1">
            <button className="p-1.5 text-white bg-white/10 rounded-md">
              <List size={16} />
            </button>
            <button className="p-1.5 text-gray-500 hover:text-gray-300">
              <LayoutGrid size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <Link
          to="/dash/tunnels/$tunnelId"
          params={{ tunnelId: "api-production" }}
          className="block group bg-black border border-white/5 rounded-lg p-4 hover:border-white/10 transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                <Globe size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-white">
                    api-production
                  </h3>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    HTTP
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500 font-mono">
                    https://api.outray.dev
                  </span>
                  <button className="text-gray-600 hover:text-gray-400 transition-colors">
                    <Copy size={12} />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-8">
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-1">
                    Requests
                  </div>
                  <div className="text-sm font-mono text-gray-300">1,240/m</div>
                </div>
                <div className="h-8 w-px bg-white/5" />
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-1">
                    Latency
                  </div>
                  <div className="text-sm font-mono text-gray-300">45ms</div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/5 border border-green-500/10 rounded-full">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-medium text-green-500">
                    Online
                  </span>
                </div>
                <button className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                  <MoreVertical size={16} />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-white/5 grid-cols-4 gap-4 hidden group-hover:grid transition-all">
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full w-3/4 bg-blue-500/50 rounded-full" />
            </div>
          </div>
        </Link>

        <Link
          to="/dash/tunnels/$tunnelId"
          params={{ tunnelId: "local-dev-server" }}
          className="block group bg-black border border-white/5 rounded-lg p-4 hover:border-white/10 transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20">
                <Terminal size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-white">
                    local-dev-server
                  </h3>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    TCP
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500 font-mono">
                    tcp://outray.dev:8080
                  </span>
                  <button className="text-gray-600 hover:text-gray-400 transition-colors">
                    <Copy size={12} />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-8">
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-1">
                    Connections
                  </div>
                  <div className="text-sm font-mono text-gray-300">12</div>
                </div>
                <div className="h-8 w-px bg-white/5" />
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-1">
                    Uptime
                  </div>
                  <div className="text-sm font-mono text-gray-300">4h 20m</div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/5 border border-green-500/10 rounded-full">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-medium text-green-500">
                    Online
                  </span>
                </div>
                <button className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                  <MoreVertical size={16} />
                </button>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
