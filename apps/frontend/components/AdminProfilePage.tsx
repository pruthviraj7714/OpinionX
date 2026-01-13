"use client";

import { getAdminProfileData } from "@/lib/api/admin.api";
import { useQuery } from "@tanstack/react-query";
import Decimal from "decimal.js";
import {
  Shield,
  TrendingUp,
  Users,
  DollarSign,
  Activity,
  CheckCircle2,
  Clock,
  BarChart3,
  Sparkles,
  Award,
  Calendar,
  Loader2,
  Mail,
  AlertCircle,
  ArrowUpRight,
  Target,
  Crown,
  Database,
  Globe,
  Eye,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface IMarket {
  id: string;
  opinion: string;
  description: string;
  expiryTime: string;
  yesPool: string;
  noPool: string;
  adminId: string;
  createdAt: Date;
  noOfTraders: number;
  status: "OPEN" | "CLOSED" | "RESOLVED";
}

export default function AdminProfilePage({
  authToken,
}: {
  authToken?: string;
}) {
  const {
    data: adminData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["adminData"],
    queryFn: () => getAdminProfileData(authToken),
    enabled: !!authToken,
  });

  const router = useRouter();

  const openMarkets = adminData?.marketsCount.open || 0;
  const closedMarkets = adminData?.marketsCount.closed || 0;
  const resolvedMarkets = adminData?.marketsCount.resolved || 0;

  const handleViewMarket = (status: "OPEN" | "CLOSED" | "RESOLVED") => {
    router.push(`/dashboard?status=${status}`);
  };

  const handleRedirectToMarketPage = (marketId: string) => {
    router.push(`/market/${marketId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-zinc-950">
        <Loader2 className="animate-spin w-10 h-10 text-zinc-300" />
        <p className="text-zinc-400 text-sm">Loading User Profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-zinc-950">
        <p className="text-red-400 text-lg font-semibold">
          Failed to load profile
        </p>
        <p className="text-zinc-400 text-sm">
          Please refresh or try again later.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden shadow-xl shadow-zinc-950/50">
          <div className="relative p-8">
            <div className="absolute inset-0 bg-linear-to-br from-purple-500/10 via-transparent to-pink-500/10" />

            <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-full bg-linear-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-600/30">
                  <Shield className="h-10 w-10 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-3xl font-bold text-zinc-100">
                      {adminData.admin?.username || "Admin"}
                    </h1>
                    <Crown className="h-6 w-6 text-amber-400" />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <Mail className="h-4 w-4" />
                    {adminData.admin?.email || "admin@opinionx.com"}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-400 ring-1 ring-purple-500/30">
                      <Shield className="h-3 w-3" />
                      Platform Administrator
                    </span>
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30">
                      <CheckCircle2 className="h-3 w-3" />
                      Full Access
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="h-1 bg-linear-to-r from-purple-600 via-pink-600 to-purple-600" />
        </div>

        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-emerald-400" />
              </div>
              <ArrowUpRight className="h-4 w-4 text-emerald-400" />
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
              Total Revenue
            </p>

            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-emerald-400">
                $
                {Number(
                  adminData.platformStats?.totalRevenue || 0
                ).toLocaleString()}
              </p>
              <span className="text-sm text-zinc-500">USD</span>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-400" />
              </div>
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
              Total Users
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-zinc-100">
                {adminData.platformStats?.totalUsers?.toLocaleString() || 0}
              </p>
              <span className="text-sm text-zinc-500">users</span>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-purple-400" />
              </div>
              <Globe className="h-4 w-4 text-zinc-500" />
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
              Total Markets
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-zinc-100">
                {(openMarkets + closedMarkets + resolvedMarkets)|| 0}
              </p>
              <span className="text-sm text-zinc-500">markets</span>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 rounded-lg bg-pink-500/20 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-pink-400" />
              </div>
              <Activity className="h-4 w-4 text-zinc-500" />
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
              Trading Volume
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-zinc-100">
                $
                {Number(
                  adminData.platformStats?.totalVolume || 0
                ).toLocaleString()}
              </p>
              <span className="text-sm text-zinc-500">USD</span>
            </div>
          </div>
        </div>

        <div className="mb-8 rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="h-5 w-5 text-purple-400" />
            <h2 className="text-lg font-bold text-zinc-100">
              Revenue Analytics
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-zinc-800/50 rounded-lg p-5 border border-zinc-700/50">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-zinc-500">Today</span>
                <Calendar className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-zinc-100">
                  ${Number(adminData.revenueData?.today || 0).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="bg-zinc-800/50 rounded-lg p-5 border border-zinc-700/50">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-zinc-500">
                  This Month
                </span>
                <TrendingUp className="h-4 w-4 text-blue-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-zinc-100">
                  $
                  {Number(
                    adminData.revenueData?.thisMonth || 0
                  ).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="bg-zinc-800/50 rounded-lg p-5 border border-zinc-700/50">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-zinc-500">
                  All Time
                </span>
                <Award className="h-4 w-4 text-purple-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-zinc-100">
                  $
                  {Number(adminData.revenueData?.allTime || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {adminData.pendingResolutions &&
          adminData.pendingResolutions.length > 0 && (
            <div className="mb-8 rounded-xl border border-amber-800 bg-amber-950/30 overflow-hidden">
              <div className="bg-linear-to-r from-amber-600/20 to-amber-500/20 px-6 py-4 border-b border-amber-800/50">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-400" />
                  <h2 className="text-lg font-bold text-amber-100">
                    Pending Market Resolutions
                  </h2>
                  <span className="ml-auto text-sm text-amber-400 font-semibold">
                    {adminData.pendingResolutions.length} requiring action
                  </span>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {adminData.pendingResolutions.map((market: IMarket) => (
                    <div
                      key={market.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-amber-600/50 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-amber-500/20 flex items-center justify-center">
                          <Clock className="h-6 w-6 text-amber-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-zinc-100 mb-1">
                            {market.opinion}
                          </h3>
                          <div className="flex items-center gap-3 text-sm text-zinc-400">
                            <span>
                              Expired:{" "}
                              {new Date(market.expiryTime).toLocaleDateString()}
                            </span>
                            <span>•</span>
                            <span>{market.noOfTraders} traders</span>
                            <span>•</span>
                            <span>
                              $
                              {new Decimal(market.yesPool)
                                .plus(new Decimal(market.noPool))
                                .toNumber()
                                .toFixed(2)
                                .toLocaleString()}{" "}
                              liquidity
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleRedirectToMarketPage(market.id)}
                          className="px-6 py-3 bg-linear-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white font-bold rounded-lg transition-all shadow-lg shadow-amber-600/30"
                        >
                          Resolve Now
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <Activity className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Open Markets
                </p>
                <p className="text-3xl font-bold text-zinc-100">
                  {openMarkets}
                </p>
              </div>
            </div>
            <div className="pt-4 border-t border-zinc-800">
              <button
                onClick={() => handleViewMarket("OPEN")}
                className="text-sm text-emerald-400 hover:text-emerald-300 font-medium transition-colors flex items-center cursor-pointer gap-1"
              >
                View All
                <ArrowUpRight className="h-3 w-3" />
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Clock className="h-6 w-6 text-amber-400" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Closed Markets
                </p>
                <p className="text-3xl font-bold text-zinc-100">
                  {closedMarkets}
                </p>
              </div>
            </div>
            <div className="pt-4 border-t border-zinc-800">
              <button
                onClick={() => handleViewMarket("CLOSED")}
                className="text-sm text-amber-400 hover:text-amber-300 font-medium transition-colors flex items-center cursor-pointer gap-1"
              >
                View All
                <ArrowUpRight className="h-3 w-3" />
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-lg bg-sky-500/20 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-sky-400" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Resolved Markets
                </p>
                <p className="text-3xl font-bold text-zinc-100">
                  {resolvedMarkets}
                </p>
              </div>
            </div>
            <div className="pt-4 border-t border-zinc-800">
              <button
                onClick={() => handleViewMarket("RESOLVED")}
                className="text-sm text-sky-400 hover:text-sky-300 font-medium transition-colors flex items-center cursor-pointer gap-1"
              >
                View All
                <ArrowUpRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>

        <div className="mb-8 rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
          <div className="bg-zinc-800/50 px-6 py-4 border-b border-zinc-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-purple-400" />
                <h2 className="text-lg font-bold text-zinc-100">
                  Recently Created Markets
                </h2>
              </div>
              <span className="text-sm text-zinc-500">
                recent {adminData.recentMarkets?.length || 0} markets 
              </span>
            </div>
          </div>

          <div className="p-6">
            {adminData.recentMarkets && adminData.recentMarkets.length > 0 ? (
              <div className="space-y-3">
                {adminData.recentMarkets.slice(0, 5).map((market: IMarket) => (
                  <div
                    key={market.id}
                    className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg bg-zinc-800/50 border border-zinc-700/50 hover:border-zinc-600 transition-all gap-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-zinc-100">
                          {market.opinion}
                        </h3>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${
                            market.status === "OPEN"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : market.status === "CLOSED"
                                ? "bg-amber-500/20 text-amber-400"
                                : "bg-sky-500/20 text-sky-400"
                          }`}
                        >
                          {market.status === "OPEN" && (
                            <Activity className="h-3 w-3" />
                          )}
                          {market.status === "CLOSED" && (
                            <Clock className="h-3 w-3" />
                          )}
                          {market.status === "RESOLVED" && (
                            <CheckCircle2 className="h-3 w-3" />
                          )}
                          {market.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-zinc-400">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          <span>
                            {new Decimal(market.yesPool)
                              .plus(new Decimal(market.noPool))
                              .toNumber()
                              .toFixed(2)
                              .toLocaleString()}{" "}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            Created{" "}
                            {new Date(market.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            Expired:{" "}
                            {new Date(market.expiryTime).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleRedirectToMarketPage(market.id)}
                        className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-100 font-medium rounded-lg cursor-pointer transition-all flex items-center gap-1"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Target className="h-16 w-16 text-zinc-700 mx-auto mb-4" />
                <p className="text-zinc-500 mb-2">No markets created yet</p>
                <p className="text-sm text-zinc-600">
                  Markets will appear here once created
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
