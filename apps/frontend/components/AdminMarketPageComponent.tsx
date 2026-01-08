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
import { Loader2 } from "lucide-react";
import {
  getParticipationChartData,
  getProbabilityChartData,
} from "@/lib/api/market.api";
import { getMarketInfoForAdmin, getMarketPositionsAndTrades } from "@/lib/api/admin.api";


export default function AdminMarketPageComponent({
  marketId,
}: {
  marketId: string;
}) {
  const { data, status } = useSession();

  const isReady = status === "authenticated";

  const [chartInterval, setChartInterval] = useState("5m");
  const [currentTradesTab, setCurrentTradesTab] = useState<
    "UserTrades" | "Trades"
  >("Trades");

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
    data: marketTradesAndPositionData,
    isLoading : marketTradesAndPositionLoading,
    error : marketTradesAndPositionError,
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

  if (isLoading || !isReady) {
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
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-lg border border-zinc-800 bg-zinc-900 px-6 py-6">
          <div className="mb-6 space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-zinc-100">
                {marketData.opinion}
              </h2>
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  marketData.status === "OPEN"
                    ? "bg-green-500/20 text-green-400"
                    : marketData.status === "CLOSED"
                      ? "bg-yellow-500/20 text-yellow-400"
                      : "bg-blue-500/20 text-blue-400"
                }`}
              >
                {marketData.status}
              </span>
            </div>
            <p className="text-base text-zinc-400">{marketData.description}</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-zinc-500">
                Active Traders
              </span>
              <span className="mt-1 text-xl font-semibold text-zinc-100">
                {marketData.noOfTraders.toLocaleString()}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-zinc-500">
                Expires on
              </span>
              <span className="mt-1 text-xl font-semibold text-zinc-100">
                {new Intl.DateTimeFormat("en-US", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(expiryDate)}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-zinc-500">
                Pool Liquidity
              </span>
              <div className="mt-2 flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-sm font-semibold text-green-400">
                    ${marketData.yesPool.toLocaleString()}
                  </span>
                </div>
                <span className="text-xs text-zinc-500">•</span>
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-red-500" />
                  <span className="text-sm font-semibold text-red-400">
                    ${marketData.noPool.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {!isResolved && (
          <div className="mb-8 rounded-lg border border-zinc-800 bg-zinc-900 px-6 py-6">
            <h3 className="mb-4 text-lg font-semibold text-zinc-100">
              Resolve Market
            </h3>

            {!isExpired ? (
              <div className="rounded-lg bg-zinc-800 p-4 text-center">
                <p className="text-sm text-zinc-400">
                  ⏳ Market has not expired yet. You can resolve it after{" "}
                  {new Intl.DateTimeFormat("en-US", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(expiryDate)}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-zinc-400">
                  Select the correct outcome for this market:
                </p>
                <div className="flex gap-4 justify-center">
                  <Button
                    onClick={() => setSelectedOutcome("YES")}
                    className={`px-8 py-3 font-semibold transition-all ${
                      selectedOutcome === "YES"
                        ? "bg-green-500 hover:bg-green-600 text-white"
                        : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                    }`}
                  >
                    YES
                  </Button>
                  <Button
                    onClick={() => setSelectedOutcome("NO")}
                    className={`px-8 py-3 font-semibold transition-all ${
                      selectedOutcome === "NO"
                        ? "bg-red-500 hover:bg-red-600 text-white"
                        : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                    }`}
                  >
                    NO
                  </Button>
                </div>
                <Button
                  onClick={handleResolveOutcome}
                  disabled={!selectedOutcome}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 disabled:bg-zinc-700 disabled:text-zinc-500"
                >
                  Submit Resolution
                </Button>
              </div>
            )}
          </div>
        )}

        {isResolved && (
          <div className="mb-8 rounded-lg border border-zinc-800 bg-zinc-900 px-6 py-6">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">✅</span>
              <h3 className="text-lg font-semibold text-zinc-100">
                Market Resolved
              </h3>
            </div>
            <p className="text-sm text-zinc-400">
              This market has been resolved as{" "}
              <span
                className={`font-bold ${
                  marketData.resolvedOutcome === "YES"
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                {marketData.resolvedOutcome}
              </span>
            </p>
          </div>
        )}

        <div className="mb-8 rounded-lg border border-zinc-800 bg-zinc-900 px-6 py-6">
          <ProbabilityChart
            data={probabilityChartData}
            setChartInterval={setChartInterval}
          />
        </div>

        <div className="mb-8 rounded-lg border border-zinc-800 bg-zinc-900 px-6 py-6">
          <h3 className="mb-6 text-lg font-semibold text-zinc-100">
            Liquidity Distribution
          </h3>
          <div className="space-y-4">
            <div className="flex h-2 overflow-hidden rounded-full bg-zinc-800">
              <div
                className="bg-green-500 transition-all duration-300"
                style={{ width: `${marketData.probability.yes}%` }}
              />
              <div
                className="bg-red-500 transition-all duration-300"
                style={{ width: `${marketData.probability.no}%` }}
              />
            </div>
            <div className="flex justify-between text-sm font-medium">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <span className="text-zinc-100">
                  YES {Number(marketData.probability.yes).toFixed(2)}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500" />
                <span className="text-zinc-100">
                  NO {Number(marketData.probability.no).toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8 rounded-lg border border-zinc-800 bg-zinc-900 overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-800">
            <h3 className="text-lg font-semibold text-zinc-100">
              All User Positions
            </h3>
          </div>
          <div className="overflow-x-auto px-4">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800">
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Username
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    YES Shares
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    NO Shares
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Total Position
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {positions.length > 0 ? (
                  positions.map((position) => (
                    <TableRow key={position.userId} className="border-zinc-800">
                      <TableCell className="font-medium text-zinc-100">
                        {position.user.username}
                      </TableCell>
                      <TableCell className="font-medium text-green-400">
                        {position.yesShares}
                      </TableCell>
                      <TableCell className="font-medium text-red-400">
                        {position.noShares}
                      </TableCell>
                      <TableCell className="font-medium text-zinc-100">
                        {position.yesShares + position.noShares}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow className="border-zinc-800">
                    <TableCell
                      colSpan={4}
                      className="py-8 text-center text-sm text-zinc-500"
                    >
                      No positions yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="mb-8 rounded-lg border border-zinc-800 bg-zinc-900 overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-800">
            <h3 className="text-lg font-semibold text-zinc-100">
              All Market Trades
            </h3>
          </div>
          <div className="overflow-x-auto px-4">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800">
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Username
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Action
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Side
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Amount In
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Amount Out
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Created At
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trades.length > 0 ? (
                  trades.map((trade) => (
                    <TableRow key={trade.id} className="border-zinc-800">
                      <TableCell className="font-medium text-zinc-100">
                        {trade.user.username}
                      </TableCell>
                      <TableCell className="font-medium text-zinc-100">
                        {trade.action}
                      </TableCell>
                      <TableCell>
                        <span
                          className={
                            trade.side === "YES"
                              ? "font-medium text-green-400"
                              : "font-medium text-red-400"
                          }
                        >
                          {trade.side}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium text-zinc-100">
                        ${trade.amountIn}
                      </TableCell>
                      <TableCell className="font-medium text-zinc-100">
                        ${trade.amountOut}
                      </TableCell>
                      <TableCell className="text-sm text-zinc-400">
                        {new Intl.DateTimeFormat("en-US", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(trade.createdAt))}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow className="border-zinc-800">
                    <TableCell
                      colSpan={6}
                      className="py-8 text-center text-sm text-zinc-500"
                    >
                      No trades yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-6 py-6">
          <h3 className="mb-6 text-lg font-semibold text-zinc-100">
            Trader Distribution
          </h3>
          <div className="flex h-80 items-center justify-center rounded-lg bg-zinc-800">
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
    </div>
  );
}
