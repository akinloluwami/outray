import { createFileRoute } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";
import { User, Mail } from "lucide-react";

export const Route = createFileRoute("/$orgSlug/settings/profile")({
  component: ProfileSettingsView,
});

function ProfileSettingsView() {
  const { data: session } = authClient.useSession();
  const user = session?.user;

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white/2 border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <User className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-white">Profile</h3>
              <p className="text-sm text-gray-500">Your personal information</p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-blue-500/20">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h4 className="text-white font-medium text-lg">{user.name}</h4>
              <p className="text-gray-500">{user.email}</p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={user.name || ""}
                  readOnly
                  className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-white/20 transition-colors cursor-not-allowed opacity-75"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="email"
                  value={user.email || ""}
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
