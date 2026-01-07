"use client";

import { fetchMarketsForAdmin } from "@/lib/api/admin.api";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";

const AdminDashboard = () => {
  const { data, status } = useSession();
  const isReady = status === "authenticated";
  const [page, setPage] = useState(1);

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

  const markets = marketResponse?.markets ?? [];
  const totalPages = marketResponse?.totalPages ?? 1;

  return (
    <div className="min-h-screen bg-zinc-50 px-8 py-10">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-semibold text-zinc-900">
            Admin Markets
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Manage and review all prediction markets
          </p>
        </div>

        <Link
          href="/admin/create-market"
          className="inline-flex items-center gap-2 bg-zinc-900 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-zinc-800 transition"
        >
          + Create Market
        </Link>
      </div>

      {markets.length === 0 && (
        <div className="text-center py-20 text-zinc-500">
          No markets found.
        </div>
      )}

      <div className="grid gap-5">
        {markets.map((market) => (
          <Link
            key={market.id}
            href={`/market/${market.id}`}
            className="group bg-white rounded-xl border border-zinc-200 p-6 hover:shadow-md transition"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-medium text-zinc-900 group-hover:underline">
                  {market.opinion}
                </h2>
                <p className="text-sm text-zinc-500 mt-1 line-clamp-2">
                  {market.description}
                </p>
              </div>

              <span
                className={`shrink-0 px-3 py-1 text-xs rounded-full font-medium ${
                  market.status === "OPEN"
                    ? "bg-emerald-100 text-emerald-700"
                    : market.status === "CLOSED"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-sky-100 text-sky-700"
                }`}
              >
                {market.status}
              </span>
            </div>

            <div className="mt-5 flex flex-wrap gap-6 text-xs text-zinc-500">
              <div>
                <span className="font-medium text-zinc-700">Expiry:</span>{" "}
                {new Date(market.expiryTime).toLocaleString()}
              </div>
              <div>
                <span className="font-medium text-zinc-700">Outcome:</span>{" "}
                {market.resolvedOutcome ?? "—"}
              </div>
              <div>
                <span className="font-medium text-zinc-700">Created:</span>{" "}
                {new Date(market.createdAt).toLocaleDateString()}
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
            className="flex items-center gap-1 px-4 py-2 text-sm border rounded-lg disabled:opacity-40 hover:bg-zinc-100 transition"
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
            className="flex items-center gap-1 px-4 py-2 text-sm border rounded-lg disabled:opacity-40 hover:bg-zinc-100 transition"
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
