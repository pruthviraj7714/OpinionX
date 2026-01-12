"use client";

import { processMarkets, useMarketFilters } from "@/hooks/useMarketFilters";
import { fetchMarketsForAdmin } from "@/lib/api/admin.api";
import { useQuery } from "@tanstack/react-query";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Users,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Clock,
} from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useMemo, useState } from "react";
import MarketFilters from "./MarketFilters";

const AdminDashboard = () => {
  const { data, status } = useSession();
  const isReady = status === "authenticated";
  const [page, setPage] = useState(1);

  const filters = useMarketFilters();

  const {
    data: marketResponse,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["markets", page, data?.accessToken],
    queryFn: () => fetchMarketsForAdmin(page, data?.accessToken),
    enabled: isReady,
  });

  const markets = marketResponse?.markets ?? [];
  const totalPages = marketResponse?.totalPages ?? 1;

  const processedMarkets = useMemo(() => {
    return processMarkets(markets, filters);
  }, [markets, filters]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-600" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 text-red-600">
        {error.message}
      </div>
    );
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "OPEN":
        return {
          bg: "bg-emerald-500/20",
          text: "text-emerald-400",
          ring: "ring-emerald-500/30",
          icon: <TrendingUp className="h-3 w-3" />,
        };
      case "CLOSED":
        return {
          bg: "bg-amber-500/20",
          text: "text-amber-400",
          ring: "ring-amber-500/30",
          icon: <Clock className="h-3 w-3" />,
        };
      case "RESOLVED":
        return {
          bg: "bg-sky-500/20",
          text: "text-sky-400",
          ring: "ring-sky-500/30",
          icon: <CheckCircle2 className="h-3 w-3" />,
        };
      default:
        return {
          bg: "bg-zinc-500/20",
          text: "text-zinc-400",
          ring: "ring-zinc-500/30",
          icon: <XCircle className="h-3 w-3" />,
        };
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 px-8 py-10">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-semibold text-zinc-100">
            Admin Markets
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Manage and review all prediction markets
          </p>
        </div>

        <Link
          href="/admin/create-market"
          className="inline-flex items-center gap-2 bg-zinc-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-zinc-600 transition"
        >
          + Create Market
        </Link>
      </div>

      <MarketFilters {...filters} />

      <div className="py-4 text-sm text-zinc-400">
        Showing {processedMarkets.length} of {markets.length} markets
        {filters.hasActiveFilters && (
          <button
            onClick={filters.onReset}
            className="ml-2 text-purple-400 hover:text-purple-300"
          >
            Clear all filters
          </button>
        )}
      </div>

      {processedMarkets.length === 0 && (
        <div className="text-center py-20 text-zinc-500">No markets found.</div>
      )}

      <div className="grid gap-5">
        {processedMarkets.map((market) => (
          <Link
            href={`/market/${market.id}`}
            key={market.id}
            className="group relative bg-zinc-800 rounded-xl border border-zinc-700 p-6 hover:border-zinc-600 hover:shadow-xl hover:shadow-zinc-950/50 transition-all duration-300 overflow-hidden"
          >
            <div className="absolute inset-0 bg-linear-to-br from-purple-500/0 via-transparent to-pink-500/0 group-hover:from-purple-500/5 group-hover:to-pink-500/5 transition-all duration-300" />

            <div className="relative">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-zinc-100 group-hover:text-transparent group-hover:bg-linear-to-r group-hover:from-purple-400 group-hover:to-pink-400 group-hover:bg-clip-text transition-all duration-300">
                    {market.opinion}
                  </h2>
                  <p className="text-sm text-zinc-400 mt-2 line-clamp-2 leading-relaxed">
                    {market.description}
                  </p>
                </div>

                <span
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full font-semibold ${getStatusConfig(market.status).bg} ${getStatusConfig(market.status).text} ring-1 ${getStatusConfig(market.status).ring}`}
                >
                  {getStatusConfig(market.status).icon}
                  {market.status}
                </span>
              </div>

              <div className="h-px bg-linear-to-r from-transparent via-zinc-700 to-transparent my-4" />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-zinc-500" />
                  <div>
                    <span className="text-zinc-500 text-xs">Expiry</span>
                    <p className="text-zinc-300 font-medium">
                      {new Date(market.expiryTime).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {market.resolvedOutcome === "YES" ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : market.resolvedOutcome === "NO" ? (
                    <XCircle className="h-4 w-4 text-red-400" />
                  ) : (
                    <TrendingUp className="h-4 w-4 text-zinc-500" />
                  )}
                  <div>
                    <span className="text-zinc-500 text-xs">Outcome</span>
                    <p
                      className={`font-medium ${
                        market.resolvedOutcome === "YES"
                          ? "text-emerald-400"
                          : market.resolvedOutcome === "NO"
                            ? "text-red-400"
                            : "text-zinc-400"
                      }`}
                    >
                      {market.resolvedOutcome || "Pending"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-zinc-500" />
                  <div>
                    <span className="text-zinc-500 text-xs">Created</span>
                    <p className="text-zinc-300 font-medium">
                      {new Date(market.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="text-xs text-purple-400 font-semibold flex items-center gap-1">
                  View Details
                  <svg
                    className="h-3 w-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-6 mt-10">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="flex items-center gap-1 px-4 py-2 text-sm border rounded-lg text-zinc-100 disabled:opacity-40 hover:bg-zinc-700 cursor-pointer transition"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <span className="text-sm text-zinc-600">
            Page <span className="font-medium">{page}</span> of{" "}
            <span className="font-medium">{totalPages}</span>
          </span>

          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="flex items-center gap-1 px-4 py-2 text-sm border rounded-lg text-zinc-100 disabled:opacity-40 hover:bg-zinc-700 cursor-pointer transition"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
