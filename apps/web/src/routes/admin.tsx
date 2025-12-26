import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Activity } from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

function AdminPage() {
  const [period, setPeriod] = useState("24h");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [phrase, setPhrase] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);

  const isAuthed = !!token;

  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/stats?period=${period}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.status === 401 || res.status === 403) {
          setToken(null);
          setAuthError("Unauthorized. Please log in again.");
          setLoading(false);
          return;
        }

        const json = await res.json();
        setData(
          json.map((d: any) => ({
            ...d,
            // Treat as local wall-clock (server wrote local time); avoid adding Z which shifts by timezone
            time: new Date(d.time.replace(" ", "T")).getTime(),
          })),
        );
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [period, token]);

  const handleLogin = async () => {
    setAuthError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phrase }),
      });

      if (!res.ok) {
        setAuthError("Invalid phrase");
        return;
      }

      const json = await res.json();
      setToken(json.token);
      setPhrase("");
    } catch (e) {
      setAuthError("Login failed");
    }
  };

  const formatXAxis = (tickItem: number) => {
    const date = new Date(tickItem);
    if (period === "1h")
      return date.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    if (period === "24h")
      return date.toLocaleTimeString([], {
        hour: "numeric",
        hour12: true,
      });
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <div className="min-h-screen bg-[#070707] text-gray-300 font-sans p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Admin Dashboard
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Global system metrics and analytics
            </p>
          </div>
        </div>

        <div className="bg-white/2 border border-white/5 rounded-2xl p-6 relative">
          {!isAuthed && (
            <div className="absolute inset-0 flex items-center justify-center backdrop-blur-xl bg-black/80 rounded-2xl z-10 transition-all duration-500">
              <div className="w-full max-w-sm p-8 bg-[#070707] border border-white/10 rounded-2xl shadow-2xl">
                <div className="flex flex-col items-center text-center mb-8">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-white/10 mb-4">
                    <div className="w-6 h-6 bg-black rounded-full" />
                  </div>
                  <h3 className="text-xl font-bold text-white tracking-tight">
                    Admin Access
                  </h3>
                  <p className="text-sm text-gray-500 mt-2">
                    Enter your passphrase to continue
                  </p>
                </div>

                <div className="space-y-4">
                  <input
                    type="password"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all"
                    placeholder="Passphrase"
                    value={phrase}
                    onChange={(e) => setPhrase(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleLogin();
                    }}
                    autoFocus
                  />

                  {authError && (
                    <p className="text-red-400 text-xs text-center font-medium">
                      {authError}
                    </p>
                  )}

                  <button
                    onClick={handleLogin}
                    className="w-full bg-white text-black font-bold rounded-xl py-3 text-sm transition-all hover:bg-gray-200 active:scale-[0.98]"
                  >
                    Unlock Dashboard
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-medium text-white flex items-center gap-2">
                <Activity size={18} className="text-accent" />
                Active Tunnels
              </h3>
              <p className="text-sm text-gray-500">
                Global active tunnel count over time
              </p>
            </div>
            <div className="flex bg-white/5 rounded-lg p-1">
              {["1h", "24h", "7d", "30d"].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    period === p
                      ? "bg-white/10 text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="h-100 w-full">
            {loading && data.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 bg-white/5 rounded-xl border border-white/5 border-dashed">
                <Activity size={32} className="mb-2 opacity-50" />
                <p>Loading stats...</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={data}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="colorTunnels"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#FFA62B" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#FFA62B" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.05)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="time"
                    tickFormatter={formatXAxis}
                    stroke="#666"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    minTickGap={30}
                  />
                  <YAxis
                    stroke="#666"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0A0A0A",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "12px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      color: "#fff",
                    }}
                    itemStyle={{ color: "#fff" }}
                    labelStyle={{ color: "#9ca3af", marginBottom: "0.25rem" }}
                    labelFormatter={(label) => new Date(label).toLocaleString()}
                  />
                  <Area
                    type="monotone"
                    dataKey="active_tunnels"
                    stroke="#FFA62B"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorTunnels)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
