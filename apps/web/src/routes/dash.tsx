import {
  createFileRoute,
  Outlet,
} from "@tanstack/react-router";
import { useState } from "react";
import { Sidebar } from "../components/Sidebar";

export const Route = createFileRoute("/dash")({
  component: DashboardLayout,
});

function DashboardLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#070707] text-gray-300 font-sans selection:bg-accent/30">
      <div className="flex h-screen overflow-hidden">
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

        <div className="flex-1 flex flex-col min-w-0 bg-[#101010] border border-white/5 m-2 rounded-2xl">
          {/* <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-black">
           
          </header> */}

          <div className="flex-1 overflow-y-auto p-6">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}

