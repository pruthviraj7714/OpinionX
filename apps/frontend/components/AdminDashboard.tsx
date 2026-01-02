"use client";

import { BACKEND_URL } from "@/lib/config";
import axios from "axios";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface IMarket {
  id: string;
  opinion: string;
  description: string;
  expiryTime: string;
  status: "OPEN" | "RESOLVED" | "CLOSED";
  resolvedOutcome: null | "YES" | "NO";
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface PaginatedMarketsResponse {
  page: number;
  limit: number;
  totalMarkets: number;
  totalPages: number;
  markets: IMarket[];
}

const AdminDashboard = () => {
  const { data, status } = useSession();

  const [markets, setMarkets] = useState<IMarket[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchMarkets = async (pageNumber = 1) => {
    try {
      setLoading(true);

      const res = await axios.get<PaginatedMarketsResponse>(
        `${BACKEND_URL}/admin/markets?page=${pageNumber}&limit=10`,
        {
          headers: {
            Authorization: `Bearer ${data?.accessToken}`,
          },
        }
      );

      setMarkets(res.data.markets);
      setPage(res.data.page);
      setTotalPages(res.data.totalPages);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to fetch markets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchMarkets(1);
    }
  }, [status]);

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Admin Markets</h1>

        <Link
          href="/admin/create-market"
          className="bg-amber-400 px-4 py-2 rounded-lg font-semibold text-black hover:bg-amber-500"
        >
          + Create Market
        </Link>
      </div>

      {loading && <p className="text-gray-500">Loading markets...</p>}

      {!loading && markets.length === 0 && (
        <p className="text-gray-500">No markets found.</p>
      )}

      <div className="space-y-4">
        {markets.map((market) => (
          <Link
            href={`/market/${market.id}`}
            key={market.id}
            className="bg-white rounded-xl cursor-pointer shadow-sm p-5 border"
          >
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-lg font-semibold">{market.opinion}</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {market.description}
                </p>
              </div>

              <span
                className={`px-3 py-1 text-sm rounded-full font-medium ${
                  market.status === "OPEN"
                    ? "bg-green-100 text-green-700"
                    : market.status === "CLOSED"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-blue-100 text-blue-700"
                }`}
              >
                {market.status}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-6 text-sm text-gray-600">
              <div>
                <span className="font-medium">Expiry:</span>{" "}
                {new Date(market.expiryTime).toLocaleString()}
              </div>

              <div>
                <span className="font-medium">Outcome:</span>{" "}
                {market.resolvedOutcome ?? "—"}
              </div>

              <div>
                <span className="font-medium">Created:</span>{" "}
                {new Date(market.createdAt).toLocaleDateString()}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-4 mt-8">
          <button
            disabled={page === 1}
            onClick={() => fetchMarkets(page - 1)}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            Previous
          </button>

          <span className="px-4 py-2 font-medium">
            Page {page} of {totalPages}
          </span>

          <button
            disabled={page === totalPages}
            onClick={() => fetchMarkets(page + 1)}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
