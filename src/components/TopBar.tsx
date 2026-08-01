"use client";

import Link from "next/link";
import {
  TrendingUp,
  LogIn,
  LogOut,
  UserPlus,
  FolderOpen,
  Heart,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

/**
 * Global top bar shown on every page.
 * The VSuccess logo + title is clickable and takes you back to the home page.
 * Shows the Following / Saved / Collections navigation once logged in.
 */
export default function TopBar() {
  const { user: authUser, loading: authLoading, logout } = useAuth();

  return (
    <header className="border-b border-white/[0.06] bg-white/[0.02] backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo + Title — clickable, goes home */}
          <Link href="/" className="group flex items-center gap-3" title="Go to home">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/20
                          transition-all duration-300 group-hover:scale-105 group-hover:shadow-blue-500/40">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="block text-lg font-bold text-white tracking-tight transition-colors duration-300 group-hover:text-white/90">
                VSuccess
              </span>
              <span className="block text-[10px] text-white/40 font-medium tracking-wider uppercase">
                Viral Video Ideas Finder
              </span>
            </div>
          </Link>

          {/* Auth / Nav Section */}
          <div className="flex items-center gap-2">
            {authLoading ? (
              <div className="w-8 h-8 rounded-full shimmer" />
            ) : authUser ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/following"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10
                             border border-white/[0.06] hover:border-blue-500/30 transition-all duration-300
                             text-xs text-white/40 hover:text-blue-400/80"
                  title="My Followed Channels"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Following</span>
                </Link>
                <Link
                  href="/bookmarks"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10
                             border border-white/[0.06] hover:border-red-500/30 transition-all duration-300
                             text-xs text-white/40 hover:text-red-400/80 group"
                  title="My Saved Videos"
                >
                  <Heart className="w-3.5 h-3.5 transition-all duration-300 group-hover:fill-red-400/30" />
                  <span className="hidden sm:inline">Saved</span>
                </Link>
                <Link
                  href="/collections"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10
                             border border-white/[0.06] hover:border-purple-500/30 transition-all duration-300
                             text-xs text-white/40 hover:text-purple-400/80"
                  title="My Collections"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Collections</span>
                </Link>
                <button
                  onClick={logout}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10
                             border border-white/[0.06] hover:border-white/[0.12] transition-all duration-300
                             text-xs text-white/40 hover:text-white/70 cursor-pointer"
                  title="Sign out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign out</span>
                </button>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-white/[0.08]">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500/40 to-purple-500/40 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-white/80">
                      {(authUser.name || authUser.email).charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-xs text-white/60 hidden sm:block max-w-[120px] truncate">
                    {authUser.name || authUser.email}
                  </span>
                  {authUser.tier === "paid" && (
                    <span className="text-[10px] font-medium text-amber-400/80 bg-amber-400/10 px-1.5 py-0.5 rounded">
                      PRO
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10
                           border border-white/[0.06] hover:border-white/[0.12] transition-all duration-300
                           text-xs text-white/50 hover:text-white/80"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign in</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
