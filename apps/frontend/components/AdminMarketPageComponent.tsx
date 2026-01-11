"use client";

import { BACKEND_URL } from "@/lib/config";
import axios from "axios";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import ProbabilityChart from "./ProbabilityChart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import YesNoDonutChart from "./ParticipationChart";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Loader2,
  PieChart,
  Shield,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  getParticipationChartData,
  getProbabilityChartData,
} from "@/lib/api/market.api";
import {
  getMarketInfoForAdmin,
  getMarketPositionsAndTrades,
  getMarketStats,
} from "@/lib/api/admin.api";
import Decimal from "decimal.js";

export default function AdminMarketPageComponent({
  marketId,
}: {
  marketId: string;
}) {
  const { data, status } = useSession();

  const isReady = status === "authenticated";

  const [chartInterval, setChartInterval] = useState("5m");

  const {
    data: marketData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["marketInfo", marketId],
    queryFn: () => getMarketInfoForAdmin(marketId, data?.accessToken),
    enabled: isReady,
    refetchInterval: 5000,
  });

  const {
    data: marketStats,
    isLoading: marketStatsLoading,
    error: marketStatsError,
  } = useQuery({
    queryKey: ["marketStats", marketId],
    queryFn: () => getMarketStats(marketId, data?.accessToken),
    enabled: isReady,
    refetchInterval: 5000,
  });

  const {
    data: marketTradesAndPositionData,
    isLoading: marketTradesAndPositionLoading,
    error: marketTradesAndPositionError,
  } = useQuery({
    queryKey: ["marketTradesAndPositions", marketId],
    queryFn: () => getMarketPositionsAndTrades(marketId, data?.accessToken),
    enabled: isReady,
  });

  const {
    data: probabilityChartData,
    isLoading: probabilityChartDataLoading,
    error: probabilityChartDataError,
  } = useQuery({
    queryKey: ["probabilityChartData", marketId, chartInterval],
    queryFn: () =>
      getProbabilityChartData(marketId, chartInterval, data?.accessToken),
    enabled: isReady,
  });
  const {
    data: participationChartData,
    isLoading: participationChartDataLoading,
    error: participationChartDataError,
  } = useQuery({
    queryKey: ["participationChartData", marketId],
    queryFn: () => getParticipationChartData(marketId, data?.accessToken),
    enabled: isReady,
  });

  const [selectedOutcome, setSelectedOutcome] = useState<"YES" | "NO" | null>(
    null
  );

  const handleResolveOutcome = async () => {
    if (
      !window.confirm(
        "are you sure you want to resolve the market with current outcome \nNote: You Cannot modify it later"
      )
    )
      return;

    try {
      const res = await axios.post(
        `${BACKEND_URL}/admin/markets/${marketId}/resolve`,
        {
          outcome: selectedOutcome,
        },
        {
          headers: {
            Authorization: `Bearer ${data?.accessToken}`,
          },
        }
      );

      toast.success(res.data.message);
    } catch (error: any) {
      toast.error(error.response.data.message || error.message, {
        position: "top-center",
      });
    }
  };

  const showLiquidity = (liq: Decimal): string => {
    if (!liq || liq.lte(0)) return "0.00";
  
    if (liq.lt(1_000)) {
      return liq.toFixed(2);
    }
  
    if (liq.lt(1_000_000)) {
      return liq.div(1_000).toFixed(1) + "K";
    }
  
    if (liq.lt(1_000_000_000)) {
      return liq.div(1_000_000).toFixed(2) + "M";
    }
  
    return liq.div(1_000_000_000).toFixed(2) + "B";
  };

  if (isLoading || !isReady || marketStatsLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-zinc-950">
        <Loader2 className="animate-spin w-10 h-10 text-zinc-300" />
        <p className="text-zinc-400 text-sm">Loading market data…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-zinc-950">
        <p className="text-red-400 text-lg font-semibold">
          Failed to load market
        </p>
        <p className="text-zinc-400 text-sm">
          Please refresh or try again later.
        </p>
      </div>
    );
  }

  const expiryDate = new Date(marketData?.expiryTime);
  const isExpired =
    Date.now() > expiryDate.getTime() && marketData?.status === "CLOSED";
  const isResolved = marketData?.status === "RESOLVED";
  const positions = marketTradesAndPositionData?.data?.positions || [];
  const trades = marketTradesAndPositionData?.data?.trades || [];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-5 w-5 text-purple-400" />
            <span className="text-sm font-semibold text-purple-400 uppercase tracking-wide">
              Admin Panel
            </span>
          </div>
          <h1 className="text-3xl font-bold text-zinc-100">
            Market Management
          </h1>
        </div>

        <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden shadow-xl shadow-zinc-950/50">
          <div className="relative p-6 pb-8">
            <div className="absolute inset-0 bg-linear-to-br from-purple-500/5 via-transparent to-pink-500/5" />

            <div className="relative space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-zinc-100 mb-2">
                    {marketData.opinion}
                  </h2>
                  <p className="text-zinc-400 leading-relaxed">
                    {marketData.description}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold ${
                      marketData.status === "OPEN"
                        ? "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30"
                        : marketData.status === "CLOSED"
                          ? "bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/30"
                          : "bg-sky-500/20 text-sky-400 ring-1 ring-sky-500/30"
                    }`}
                  >
                    {marketData.status === "OPEN" && (
                      <Activity className="h-3.5 w-3.5" />
                    )}
                    {marketData.status === "CLOSED" && (
                      <Clock className="h-3.5 w-3.5" />
                    )}
                    {marketData.status === "RESOLVED" && (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    )}
                    {marketData.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 md:grid-cols-5 gap-4 pt-4">
                <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-purple-400" />
                    <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                      Traders
                    </span>
                  </div>
                  <span className="text-2xl font-bold text-zinc-100">
                    {marketData.noOfTraders.toLocaleString()}
                  </span>
                </div>

                <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-purple-400" />
                    <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                      Expires
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-zinc-100">
                    {new Intl.DateTimeFormat("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(expiryDate)}
                  </span>
                </div>

                <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-4 w-4 text-purple-400" />
                    <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                      Liquidity
                    </span>
                  </div>
                  <span className="text-2xl font-bold text-zinc-100">
                    ${showLiquidity(new Decimal(marketData.liquidity || 0))}
                  </span>
                </div>

                <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="h-4 w-4 text-purple-400" />
                    <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                      Trades
                    </span>
                  </div>
                  <span className="text-2xl font-bold text-zinc-100">
                    {marketStats?.tradeCount || 0}
                  </span>
                </div>

                <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="h-4 w-4 text-purple-400" />
                    <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                      Volume
                    </span>
                  </div>
                  <span className="text-2xl font-bold text-zinc-100">
                    {marketData?.volume || 0}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
                  <span className="text-sm text-zinc-400">YES Pool:</span>
                  <span className="text-sm font-bold text-emerald-400">
                    ${marketData.yesPool.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-500 shadow-lg shadow-red-500/50" />
                  <span className="text-sm text-zinc-400">NO Pool:</span>
                  <span className="text-sm font-bold text-red-400">
                    ${marketData.noPool.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="h-1 bg-linear-to-r from-purple-600 via-pink-600 to-purple-600" />
        </div>

        <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="h-5 w-5 text-purple-400" />
            <h3 className="text-lg font-bold text-zinc-100">
              Revenue Statistics
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-zinc-800/50 rounded-lg p-5 border border-zinc-700/50">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-zinc-500">
                  Total Fees
                </span>
                <ArrowUpRight className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-zinc-100">
                  ${marketStats.totalFees}
                </span>
                <span className="text-sm text-zinc-500">USD</span>
              </div>
            </div>

            <div className="bg-zinc-800/50 rounded-lg p-5 border border-zinc-700/50">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-zinc-500">
                  Avg Trade Size
                </span>
                <TrendingUp className="h-4 w-4 text-purple-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-zinc-100">${Number(marketData.averageTradeSize || 0).toFixed(2)}</span>
                <span className="text-sm text-zinc-500">USD</span>
              </div>
            </div>

            <div className="bg-zinc-800/50 rounded-lg p-5 border border-zinc-700/50">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-zinc-500">
                  Fee Rate
                </span>
                <BarChart3 className="h-4 w-4 text-pink-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-zinc-100">
                  {marketData.feePercent}
                </span>
                <span className="text-sm text-zinc-500">%</span>
              </div>
            </div>
          </div>
        </div>

        {!isResolved && (
          <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
            <div className="bg-linear-to-r from-purple-600/10 to-pink-600/10 px-6 py-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-purple-400" />
                <h3 className="text-lg font-bold text-zinc-100">
                  Resolve Market
                </h3>
              </div>
            </div>

            <div className="p-6">
              {!isExpired ? (
                <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-6 text-center">
                  <Clock className="h-12 w-12 text-amber-400 mx-auto mb-3" />
                  <p className="text-zinc-300 font-medium mb-2">
                    Market Not Yet Expired
                  </p>
                  <p className="text-sm text-zinc-400">
                    Resolution will be available after{" "}
                    <span className="font-semibold text-zinc-300">
                      {new Intl.DateTimeFormat("en-US", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(expiryDate)}
                    </span>
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="text-center">
                    <p className="text-zinc-400 mb-4">
                      Select the correct outcome for this market:
                    </p>
                    <div className="flex gap-4 justify-center">
                      <button
                        onClick={() => setSelectedOutcome("YES")}
                        className={`group relative px-12 py-4 font-bold rounded-lg transition-all ${
                          selectedOutcome === "YES"
                            ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 scale-105"
                            : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700"
                        }`}
                      >
                        <CheckCircle2 className="inline-block h-5 w-5 mr-2" />
                        YES
                      </button>
                      <button
                        onClick={() => setSelectedOutcome("NO")}
                        className={`group relative px-12 py-4 font-bold rounded-lg transition-all ${
                          selectedOutcome === "NO"
                            ? "bg-red-600 text-white shadow-lg shadow-red-600/30 scale-105"
                            : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700"
                        }`}
                      >
                        <AlertCircle className="inline-block h-5 w-5 mr-2" />
                        NO
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleResolveOutcome}
                    disabled={!selectedOutcome}
                    className="w-full py-4 px-6 bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-zinc-700 disabled:to-zinc-700 text-white font-bold rounded-lg transition-all shadow-lg shadow-purple-600/20 hover:shadow-purple-600/30 disabled:shadow-none flex items-center justify-center gap-2"
                  >
                    <Sparkles className="h-5 w-5" />
                    Submit Resolution
                  </button>

                  <div className="rounded-lg bg-purple-500/10 border border-purple-500/20 p-4">
                    <p className="text-xs text-zinc-400 text-center">
                      ⚠️ This action is permanent and cannot be undone. Please
                      verify the outcome carefully.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {isResolved && (
          <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
            <div className="bg-linear-to-r from-sky-600/10 to-blue-600/10 p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-sky-500/20 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-sky-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-100 mb-1">
                    Market Resolved
                  </h3>
                  <p className="text-sm text-zinc-400">
                    This market has been resolved as{" "}
                    <span
                      className={`font-bold text-lg ${
                        marketData.resolvedOutcome === "YES"
                          ? "text-emerald-400"
                          : "text-red-400"
                      }`}
                    >
                      {marketData.resolvedOutcome}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-purple-400" />
              <h3 className="text-lg font-bold text-zinc-100">Price History</h3>
            </div>
            <ProbabilityChart
              data={probabilityChartData}
              setChartInterval={setChartInterval}
            />
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="flex items-center gap-2 mb-4">
              <PieChart className="h-5 w-5 text-purple-400" />
              <h3 className="text-lg font-bold text-zinc-100">
                Trader Distribution
              </h3>
            </div>
            <div className="flex h-64 items-center justify-center rounded-lg bg-zinc-800/50">
              {participationChartData ? (
                <YesNoDonutChart
                  yesTraders={participationChartData.yesTraders}
                  noTraders={participationChartData.noTraders}
                />
              ) : (
                <p className="text-sm text-zinc-500">No data available</p>
              )}
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <h3 className="text-lg font-bold text-zinc-100 mb-6">
            Liquidity Distribution
          </h3>
          <div className="space-y-4">
            <div className="flex h-3 overflow-hidden rounded-full bg-zinc-800">
              <div
                className="bg-linear-to-r from-emerald-500 to-emerald-400 transition-all duration-300"
                style={{ width: `${marketData.probability.yes}%` }}
              />
              <div
                className="bg-linear-to-r from-red-500 to-red-400 transition-all duration-300"
                style={{ width: `${marketData.probability.no}%` }}
              />
            </div>
            <div className="flex justify-between text-sm font-semibold">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
                <span className="text-zinc-100">YES</span>
                <span className="text-emerald-400">
                  {Number(marketData.probability.yes).toFixed(2)}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500 shadow-lg shadow-red-500/50" />
                <span className="text-zinc-100">NO</span>
                <span className="text-red-400">
                  {Number(marketData.probability.no).toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
          <div className="bg-zinc-800/50 px-6 py-4 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-400" />
              <h3 className="text-lg font-bold text-zinc-100">
                User Positions
              </h3>
              <span className="ml-auto text-sm text-zinc-500">
                {positions.length}{" "}
                {positions.length === 1 ? "position" : "positions"}
              </span>
            </div>
          </div>
          <div className="overflow-x-auto px-4">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-zinc-800/60">
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Username
                  </TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    YES Shares
                  </TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    NO Shares
                  </TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Total
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {positions.length > 0 ? (
                  positions.map((position) => (
                    <TableRow
                      key={position.userId}
                      className="border-zinc-800 hover:bg-zinc-800/60 px-6 transition-colors"
                    >
                      <TableCell className="font-semibold text-zinc-100">
                        {position.user.username}
                      </TableCell>
                      <TableCell className="font-semibold text-emerald-400">
                        {position.yesShares.toLocaleString()}
                      </TableCell>
                      <TableCell className="font-semibold text-red-400">
                        {position.noShares.toLocaleString()}
                      </TableCell>
                      <TableCell className="font-semibold text-zinc-100">
                        {(
                          position.yesShares + position.noShares
                        ).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow className="border-zinc-800 hover:bg-zinc-800/60">
                    <TableCell colSpan={4} className="py-12 text-center">
                      <Users className="h-12 w-12 text-zinc-700 mx-auto mb-3" />
                      <p className="text-sm text-zinc-500">No positions yet</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
          <div className="bg-zinc-800/50 px-6 py-4 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-400" />
              <h3 className="text-lg font-bold text-zinc-100">Market Trades</h3>
              <span className="ml-auto text-sm text-zinc-500">
                {trades.length} {trades.length === 1 ? "trade" : "trades"}
              </span>
            </div>
          </div>
          <div className="overflow-x-auto px-4">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 bg-zinc-800/30 hover:bg-zinc-800/60">
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Username
                  </TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Action
                  </TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Side
                  </TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Amount In
                  </TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Amount Out
                  </TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Time
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trades.length > 0 ? (
                  trades.map((trade) => (
                    <TableRow
                      key={trade.id}
                      className="border-zinc-800 hover:bg-zinc-800/60 transition-colors"
                    >
                      <TableCell className="font-semibold text-zinc-100">
                        {trade.user.username}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${
                            trade.action === "BUY"
                              ? "bg-blue-500/20 text-blue-400"
                              : "bg-orange-500/20 text-orange-400"
                          }`}
                        >
                          {trade.action === "BUY" ? (
                            <ArrowDownRight className="h-3 w-3" />
                          ) : (
                            <ArrowUpRight className="h-3 w-3" />
                          )}
                          {trade.action}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`font-bold ${
                            trade.side === "YES"
                              ? "text-emerald-400"
                              : "text-red-400"
                          }`}
                        >
                          {trade.side}
                        </span>
                      </TableCell>
                      <TableCell className="font-semibold text-zinc-100">
                        ${Number(trade.amountIn).toLocaleString()}
                      </TableCell>
                      <TableCell className="font-semibold text-zinc-100">
                        ${Number(trade.amountOut).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm text-zinc-400">
                        {new Intl.DateTimeFormat("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }).format(new Date(trade.createdAt))}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow className="border-zinc-800">
                    <TableCell colSpan={6} className="py-12 text-center">
                      <Activity className="h-12 w-12 text-zinc-700 mx-auto mb-3" />
                      <p className="text-sm text-zinc-500">No trades yet</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
