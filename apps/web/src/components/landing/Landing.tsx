import { useEffect, useState } from "react";
import { Github, LayoutDashboard, LogIn, Activity } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { authClient } from "../../lib/auth-client";
import { DeveloperExperience } from "./developer-experience";
import { NetworkDiagram } from "./network-diagram";
import { BringYourOwnDomain } from "./bring-your-own-domain";
import { OpenSource } from "./opensource";
import { Hero } from "./hero";

export const Landing = () => {
  const { data: session } = authClient.useSession();
  const { data: organizations } = authClient.useListOrganizations();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white selection:bg-accent/30">
      {/* Navigation */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-black/80 backdrop-blur-md border-b border-white/5 py-4"
            : "bg-transparent py-6"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-black" />
            </div>
            <span className="text-xl font-bold tracking-tight">OutRay</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/60">
            <a href="#docs" className="hover:text-white transition-colors">
              Documentation
            </a>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://github.com/akinloluwami/outray"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-2 text-white/60 hover:text-white transition-colors"
            >
              <Github size={20} />
            </a>
            {session ? (
              <Link
                to="/$orgSlug"
                params={{
                  orgSlug: organizations?.[0]?.slug || "default",
                }}
                className="px-5 py-2 bg-white text-black rounded-full font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
              >
                <LayoutDashboard size={16} />
                Dashboard
              </Link>
            ) : (
              <Link
                to="/login"
                className="px-5 py-2 bg-white text-black rounded-full font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
              >
                <LogIn size={16} />
                Login
              </Link>
            )}
          </div>
        </div>
      </nav>

      <Hero />

      <div className="py-24 border-white/5">
        <DeveloperExperience />
      </div>

      <NetworkDiagram />

      <BringYourOwnDomain />

      <OpenSource />

      <footer className="border-t border-white/10 py-12 bg-black">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-accent rounded-md flex items-center justify-center">
              <Activity className="w-4 h-4 text-black" />
            </div>
            <span className="font-bold">OutRay</span>
          </div>
          <div className="text-white/40 text-sm">
            © {new Date().getFullYear()} OutRay. All rights reserved.
          </div>
          <div className="flex gap-6 text-white/60">
            <a
              href="https://twitter.com/outraytunnel"
              target="_blank"
              className="hover:text-white transition-colors"
            >
              Twitter
            </a>
            <a
              href="https://github.com/akinloluwami/outray"
              target="_blank"
              className="hover:text-white transition-colors"
            >
              GitHub
            </a>
            <a
              href="https://discord.gg/DncjGcCHDg"
              target="_blank"
              className="hover:text-white transition-colors"
            >
              Discord
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
