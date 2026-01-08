"use client";

import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LayoutDashboard, LogOut, TrendingUp, User } from "lucide-react";

export default function Appbar() {
  const session = useSession();

  const router = useRouter();
  const handleSignout = async () => {
    await signOut({
      callbackUrl: "/",
    });
  };

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl bg-zinc-900/90 border-b border-zinc-800 shadow-lg shadow-zinc-950/20">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => {
              router.push(session.status === "authenticated" ? "/dashboard" : "/");
            }}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-linear-to-r from-purple-500 to-pink-500 rounded-lg blur-md opacity-50 group-hover:opacity-75 transition-opacity duration-300" />
              <div className="relative bg-linear-to-br from-purple-600 to-pink-600 p-2 rounded-lg shadow-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-xl font-bold bg-linear-to-r from-zinc-100 to-zinc-300 bg-clip-text text-transparent">
                Opinion
              </span>
              <span className="ml-1 text-2xl font-black bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                X
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {session.status === "authenticated" ? (
              <>
                <div className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700">
                  <div className="h-8 w-8 rounded-full bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-zinc-400">Signed in as</span>
                    <span className="text-sm font-semibold text-zinc-100">
                      {session.data?.user.username || "User"}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => router.push("/dashboard")}
                  className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 text-zinc-100 font-medium transition-all duration-200"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Dashboard</span>
                </button>

                <button
                  onClick={handleSignout}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition-all duration-200 shadow-lg shadow-red-600/20 hover:shadow-red-600/30"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push("/login")}
                  className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 text-zinc-100 font-medium transition-all duration-200"
                >
                  Sign In
                </button>

                <button
                  onClick={() => router.push("/register")}
                  className="px-4 py-2 rounded-lg bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold transition-all duration-200 shadow-lg shadow-purple-600/20 hover:shadow-purple-600/30"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {session.status === "authenticated" && (
        <div className="sm:hidden border-t border-zinc-800 px-4 py-2 bg-zinc-800/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <User className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-sm text-zinc-300">
                {session.data?.user?.email || "User"}
              </span>
            </div>
            <button
              onClick={() => router.push("/dashboard")}
              className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-zinc-700 hover:bg-zinc-600 text-zinc-100 text-sm font-medium transition-all"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span>Dashboard</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
