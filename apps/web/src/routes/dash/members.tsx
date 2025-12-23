import { createFileRoute } from "@tanstack/react-router";
import { Plus, MoreVertical } from "lucide-react";
import { authClient } from "../../lib/auth-client";

export const Route = createFileRoute("/dash/members")({
  component: MembersView,
});

function MembersView() {
  const { data: session } = authClient.useSession();
  const user = session?.user;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Members
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage who has access to this organization
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-xl font-medium hover:bg-gray-200 transition-colors">
          <Plus size={18} />
          Invite Member
        </button>
      </div>

      <div className="bg-white/2 border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h3 className="text-lg font-medium text-white">Team Members</h3>
        </div>

        <div className="divide-y divide-white/5">
          {user && (
            <div className="p-4 flex items-center justify-between hover:bg-white/2 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-white font-medium">{user.name}</h4>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="px-2.5 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium border border-accent/20">
                  Owner
                </span>
                <button className="p-2 text-gray-500 hover:text-white transition-colors">
                  <MoreVertical size={18} />
                </button>
              </div>
            </div>
          )}

          {/* Placeholder for other members */}
          {[1, 2].map((i) => (
            <div
              key={i}
              className="p-4 flex items-center justify-between hover:bg-white/2 transition-colors opacity-50"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-500 font-bold">
                  ?
                </div>
                <div>
                  <h4 className="text-gray-400 font-medium">Invited User</h4>
                  <p className="text-sm text-gray-600">user{i}@example.com</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="px-2.5 py-1 rounded-full bg-white/5 text-gray-400 text-xs font-medium border border-white/10">
                  Member
                </span>
                <button className="p-2 text-gray-500 hover:text-white transition-colors">
                  <MoreVertical size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
