"use client";

import { BACKEND_URL } from "@/lib/config";
import axios from "axios";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import Decimal from "decimal.js";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import ProbabilityChart from "./ProbabilityChart";
import YesNoDonutChart from "./ParticipationChart";
import { TradingCard } from "./TradingCard";
import {
  useQueryClient,
  useQuery,
  useInfiniteQuery,
} from "@tanstack/react-query";
import {
  getUserBalance,
  getUserPosition,
  getUserTrades,
} from "@/lib/api/user.api";
import {
  checkPayoutEligibility,
  getMarketInfo,
  getMarketTrades,
  getParticipationChartData,
  getProbabilityChartData,
} from "@/lib/api/market.api";
import { ITrade } from "@/types/market";
import {
  TrendingUp,
  Users,
  Calendar,
  DollarSign,
  Activity,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  PieChart,
  Trophy,
  BarChart3,
} from "lucide-react";
import { Button } from "./ui/button";
import { formatDistanceToNow } from "date-fns";
import { TradesTable } from "./TradesTable";

export default function MarketPageComponent({
  marketId,
}: {
  marketId: string;
}) {
  const { data, status } = useSession();
  const isReady = status === "authenticated";

  const [currentTab, setCurrentTab] = useState<"BUY" | "SELL">("BUY");
  const [currentSharesTab, setCurrentSharesTab] = useState<"YES" | "NO">("YES");
  const [amount, setAmount] = useState<string>("");
  const [amountToReceive, setamountToReceive] = useState<Decimal>(
    new Decimal(0)
  );
  const [chartInterval, setChartInterval] = useState("5m");
  const [currentTradesTab, setCurrentTradesTab] = useState<string>("Trades");

  const [page, setPage] = useState(1);
  const [trades, setTrades] = useState<ITrade[]>([]);

  const {
    data: marketData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["marketInfo", marketId],
    queryFn: () => getMarketInfo(marketId, data?.accessToken),
    enabled: isReady,
    refetchInterval: 5000,
  });
  const { data: position, isLoading: positionLoading } = useQuery({
    queryKey: ["position", marketId],
    queryFn: () => getUserPosition(marketId, data?.accessToken),
    enabled: isReady,
  });
  const { data: balance, isLoading: balanceLoading } = useQuery({
    queryKey: ["balance"],
    queryFn: () => getUserBalance(data?.accessToken),
    enabled: isReady,
  });

  const {
    data: marketTradesData,
    fetchNextPage: fetchNextMarketPage,
    hasNextPage: hasNextMarketPage,
    isFetchingNextPage: isFetchingNextMarketPage,
    isLoading: marketTradesLoading,
    error: marketTradesError,
  } = useInfiniteQuery<{
    trades: ITrade[];
    nextCursor?: string | null;
  }>({
    queryKey: ["marketTrades", marketId],
    queryFn: ({ pageParam }) =>
      getMarketTrades(marketId, pageParam as string | undefined, data?.accessToken),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: isReady && currentTradesTab === "Trades",
  });

  const {
    data: userTradesData,
    fetchNextPage: fetchNextUserPage,
    hasNextPage: hasNextUserPage,
    isFetchingNextPage: isFetchingNextUserPage,
    isLoading: userTradesLoading,
    error: userTradesError,
  } = useInfiniteQuery<{
    trades: ITrade[];
    nextCursor?: string | null;
  }>({
    queryKey: ["userTrades", marketId],
    queryFn: ({ pageParam }) =>
      getUserTrades(marketId, pageParam as string | undefined, data?.accessToken),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: isReady && currentTradesTab === "UserTrades",
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

  const accessToken = data?.accessToken;
  const isResolved = marketData?.status === "RESOLVED";

  const {
    data: eligibility,
    isLoading: checking,
    error: eligibilityError,
  } = useQuery({
    queryKey: ["eligibility", marketId],
    queryFn: () => checkPayoutEligibility(marketId, accessToken!),
    enabled: status === "authenticated" && !!accessToken && isResolved,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
  });

  const queryClient = useQueryClient();

  const handlePlaceTrade = async () => {
    try {
      const res = await axios.post(
        `${BACKEND_URL}/markets/${marketId}/trades`,
        {
          side: currentSharesTab,
          action: currentTab,
          amount,
        },
        {
          headers: {
            Authorization: `Bearer ${data?.accessToken}`,
          },
        }
      );
      toast.success(res.data.message, { position: "top-center" });

      await queryClient.invalidateQueries({ 
        queryKey: ["marketTrades", marketId] 
      });
      
      await queryClient.invalidateQueries({ 
        queryKey: ["userTrades", marketId] 
      });
      await queryClient.invalidateQueries({ queryKey: ["marketInfo", marketId] });
      await queryClient.invalidateQueries({ queryKey: ["position", marketId] });
      await queryClient.invalidateQueries({ queryKey: ["balance"] });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message, {
        position: "top-center",
      });
    }
  };

  const handleCalculateRecievingAmount = () => {
    if (!marketData) return;

    let newYesPool;
    let newNoPool;
    let amountToBeRecieved;

    const k = new Decimal(marketData.yesPool).mul(
      new Decimal(marketData.noPool)
    );

    if (currentTab === "BUY" && currentSharesTab === "YES") {
      newYesPool = new Decimal(marketData.yesPool).plus(amount);
      newNoPool = k.div(newYesPool);
      amountToBeRecieved = new Decimal(marketData.noPool).minus(newNoPool);
    } else if (currentTab === "BUY" && currentSharesTab === "NO") {
      newNoPool = new Decimal(marketData.noPool).plus(amount);
      newYesPool = k.div(newNoPool);
      amountToBeRecieved = new Decimal(marketData.yesPool).minus(newYesPool);
    } else if (currentTab === "SELL" && currentSharesTab === "YES") {
      newYesPool = new Decimal(marketData.yesPool).plus(amount);
      newNoPool = k.div(newYesPool);
      amountToBeRecieved = new Decimal(marketData.noPool).minus(newNoPool);
    } else if (currentTab === "SELL" && currentSharesTab === "NO") {
      newNoPool = new Decimal(marketData.noPool).plus(amount);
      newYesPool = k.div(newNoPool);
      amountToBeRecieved = new Decimal(marketData.yesPool).minus(newYesPool);
    }

    setamountToReceive(amountToBeRecieved || new Decimal(0));
  };

  const calculateFee = () => {
    if (!amount) return "0.00";
    return currentTab === "BUY"
      ? new Decimal(amount)
          .mul(marketData.feePercent)
          .div(100)
          .toFixed(2)
          .toString()
      : new Decimal(amountToReceive)
          .mul(marketData.feePercent)
          .div(100)
          .toFixed(2)
          .toString();
  };

  const calculateFinal = () => {
    if (!amount) return "0.00";
    const fee =
      currentTab === "BUY"
        ? new Decimal(amount).mul(marketData.feePercent).div(100)
        : new Decimal(amountToReceive).mul(marketData.feePercent).div(100);
    return currentTab === "BUY"
      ? new Decimal(amount).minus(fee).toFixed(2).toString()
      : new Decimal(amountToReceive).minus(fee).toFixed(2).toString();
  };

  const calculateFinalReceivingAmount = () => {
    if (!marketData || !amount) return "0.00";

    const fee =
      currentTab === "BUY"
        ? new Decimal(amount).mul(marketData.feePercent).div(100)
        : new Decimal(amountToReceive).mul(marketData.feePercent).div(100);

    const finalAmount = new Decimal(amount).minus(fee);

    let newYesPool;
    let newNoPool;
    let amountToBeRecieved;

    const k = new Decimal(marketData.yesPool).mul(
      new Decimal(marketData.noPool)
    );

    if (currentTab === "BUY" && currentSharesTab === "YES") {
      newYesPool = new Decimal(marketData.yesPool).plus(finalAmount);
      newNoPool = k.div(newYesPool);
      amountToBeRecieved = new Decimal(marketData.noPool).minus(newNoPool);
    } else if (currentTab === "BUY" && currentSharesTab === "NO") {
      newNoPool = new Decimal(marketData.noPool).plus(finalAmount);
      newYesPool = k.div(newNoPool);
      amountToBeRecieved = new Decimal(marketData.yesPool).minus(newYesPool);
    }

    return currentTab === "BUY"
      ? (amountToBeRecieved || 0).toString()
      : new Decimal(amountToReceive).minus(fee).toFixed(2).toString();
  };

  const handleMax = () => {
    if (!position || !balance) return;

    if (currentTab === "BUY") {
      setAmount(balance.toString());
    } else {
      if (currentSharesTab === "YES") {
        setAmount((position.yesShares || 0).toString());
      } else {
        setAmount((position.noShares || 0).toString());
      }
    }
  };

  const handleClaimPayout = async () => {
    try {
      const res = await axios.post(
        `${BACKEND_URL}/markets/${marketId}/claim`,
        {},
        {
          headers: {
            Authorization: `Bearer ${data?.accessToken}`,
          },
        }
      );

      toast.success(res.data.message, { position: "top-center" });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message, {
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

  useEffect(() => {
    if (!amount || amount.length === 0) return;

    let timeout = setTimeout(() => {
      handleCalculateRecievingAmount();
    }, 300);

    return () => {
      clearTimeout(timeout);
    };
  }, [amount, currentSharesTab, currentTab, marketData]);

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

  const expiryDate = new Date(marketData.expiryTime);

  const displayedTrades =
    currentTradesTab === "Trades"
      ? (marketTradesData?.pages.flatMap((page) => page.trades) ?? [])
      : (userTradesData?.pages.flatMap((page) => page.trades) ?? []);

  const isTradesLoading =
    currentTradesTab === "Trades" ? marketTradesLoading : userTradesLoading;

  const tradesError =
    currentTradesTab === "Trades" ? marketTradesError : userTradesError;

  const hasNextPage =
    currentTradesTab === "Trades" ? hasNextMarketPage : hasNextUserPage;

  const isFetchingNextPage =
    currentTradesTab === "Trades"
      ? isFetchingNextMarketPage
      : isFetchingNextUserPage;

  const fetchNextPage =
    currentTradesTab === "Trades" ? fetchNextMarketPage : fetchNextUserPage;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden shadow-xl shadow-zinc-950/50">
          <div className="relative p-6 pb-8">
            <div className="absolute inset-0 bg-linear-to-br from-purple-500/5 via-transparent to-pink-500/5" />

            <div className="relative space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-zinc-100 mb-3">
                    {marketData.opinion}
                  </h1>
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

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4">
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
              </div>

              <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="h-4 w-4 text-purple-400" />
                  <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                    Volume
                  </span>
                </div>
                <div className="text-2xl flex items-baseline gap-2 font-bold text-zinc-100">
                  <span className="text-3xl font-bold text-zinc-100">
                    ${marketData?.volume || 0}
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
                  <span className="text-3xl font-bold text-zinc-100">
                    ${Number(marketData.averageTradeSize || 0).toFixed(2)}
                  </span>
                  <span className="text-sm text-zinc-500">USD</span>
                </div>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
                  <span className="text-sm text-zinc-400">YES:</span>
                  <span className="text-sm font-bold text-emerald-400">
                    ${marketData.yesPool.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-500 shadow-lg shadow-red-500/50" />
                  <span className="text-sm text-zinc-400">NO:</span>
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
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-purple-400" />
            <h3 className="text-lg font-bold text-zinc-100">Price History</h3>
          </div>
          {probabilityChartDataLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="animate-spin text-zinc-500" />
            </div>
          ) : probabilityChartDataError ? (
            <div className="flex h-64 items-center justify-center">
              <p className="text-sm text-red-400">Failed to load chart</p>
            </div>
          ) : (
            <ProbabilityChart
              data={probabilityChartData}
              setChartInterval={setChartInterval}
            />
          )}
        </div>

        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {marketData.status === "OPEN" ? (
              <TradingCard
                currentTab={currentTab}
                setCurrentTab={setCurrentTab}
                currentSharesTab={currentSharesTab}
                setCurrentSharesTab={setCurrentSharesTab}
                amount={amount}
                setAmount={setAmount}
                balance={balance ? balance.toString() : "0"}
                calculateFee={calculateFee}
                calculateFinal={calculateFinal}
                calculateFinalReceivingAmount={calculateFinalReceivingAmount}
                amountToReceive={amountToReceive.toString()}
                onMax={handleMax}
                onTrade={handlePlaceTrade}
                platformFees={marketData.feePercent}
              />
            ) : marketData.status === "CLOSED" ? (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/20 mb-4">
                  <Clock className="h-8 w-8 text-amber-400" />
                </div>
                <h3 className="text-xl font-bold text-zinc-100 mb-2">
                  Market Closed
                </h3>
                <p className="text-zinc-400 mb-3">
                  Trading has ended. The admin will resolve the outcome soon.
                </p>
                <p className="text-sm text-zinc-500">
                  You'll be able to claim your payout after resolution.
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
                <div className="bg-linear-to-r from-sky-600/10 to-blue-600/10 p-6 border-b border-zinc-800">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-sky-500/20 flex items-center justify-center">
                      <CheckCircle2 className="h-6 w-6 text-sky-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-zinc-100 mb-1">
                        Market Resolved
                      </h3>
                      <p className="text-sm text-zinc-400">
                        Final outcome:{" "}
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

                <div className="p-6">
                  {checking ? (
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Checking payout eligibility...</span>
                    </div>
                  ) : eligibilityError ? (
                    <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4">
                      <p className="text-sm text-red-400">
                        Failed to check payout eligibility
                      </p>
                    </div>
                  ) : eligibility && eligibility.participated ? (
                    eligibility.payoutStatus === "CLAIMED" ? (
                      <div className="space-y-4">
                        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-4">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                            <p className="text-sm text-emerald-300 font-medium">
                              Payout Already Claimed
                            </p>
                          </div>
                        </div>
                        <button
                          disabled
                          className="w-full py-3 px-6 bg-zinc-800 text-zinc-500 font-semibold rounded-lg cursor-not-allowed"
                        >
                          Payout Claimed
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="rounded-lg bg-purple-500/10 border border-purple-500/20 p-4">
                          <p className="text-sm text-zinc-300 mb-3">
                            You are eligible to claim your payout based on your
                            final position.
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-zinc-400">
                              Amount to claim:
                            </span>
                            <span className="text-2xl font-bold text-zinc-100">
                              ${eligibility.payoutAmount}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={handleClaimPayout}
                          className="w-full py-3 px-6 bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-lg transition-all shadow-lg shadow-purple-600/20 hover:shadow-purple-600/30 flex items-center justify-center gap-2"
                        >
                          <Trophy className="h-5 w-5" />
                          Claim Payout
                        </button>
                      </div>
                    )
                  ) : (
                    <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-center">
                      <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
                      <p className="text-sm text-red-300">
                        You are not eligible to claim a payout because you did
                        not participate in this market.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="flex items-center gap-2 mb-6">
              <Zap className="h-5 w-5 text-purple-400" />
              <h3 className="text-lg font-bold text-zinc-100">Your Position</h3>
            </div>

            {positionLoading || balanceLoading ? (
              <div className="flex items-center gap-2 text-zinc-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Loading...</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg bg-zinc-800/50 border border-zinc-700/50 p-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">
                    YES Shares
                  </p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-4xl font-bold text-emerald-400">
                      {new Decimal(position?.yesShares || 0)
                        .toNumber()
                        .toFixed(2) ?? 0}
                    </p>
                    <span className="text-sm text-zinc-500">shares</span>
                  </div>
                </div>
                <div className="rounded-lg bg-zinc-800/50 border border-zinc-700/50 p-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">
                    NO Shares
                  </p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-4xl font-bold text-red-400">
                      {new Decimal(position?.noShares || 0)
                        .toNumber()
                        .toFixed(2) ?? 0}
                    </p>
                    <span className="text-sm text-zinc-500">shares</span>
                  </div>
                </div>
              </div>
            )}
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
          <div className="border-b border-zinc-800 px-6 py-4">
            <div className="flex gap-6">
              {["Trades", "UserTrades"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setCurrentTradesTab(tab)}
                  className={`pb-2 text-sm font-bold transition-colors relative ${
                    currentTradesTab === tab
                      ? "text-purple-400"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {tab === "Trades" ? "Market Trades" : "Your Trades"}
                  {currentTradesTab === tab && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-linear-to-r from-purple-600 to-pink-600" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto px-4">
            <TradesTable
              displayedTrades={displayedTrades}
              isLoading={isTradesLoading}
              fetchNextPage={fetchNextPage}
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              isError={tradesError}
            />
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="flex items-center gap-2 mb-6">
            <PieChart className="h-5 w-5 text-purple-400" />
            <h3 className="text-lg font-bold text-zinc-100">
              Trader Distribution
            </h3>
          </div>
          <div className="flex h-80 items-center justify-center rounded-lg bg-zinc-800/50">
            {participationChartDataLoading ? (
              <Loader2 className="animate-spin text-zinc-500" />
            ) : participationChartDataError ? (
              <p className="text-sm text-red-400">Failed to load data</p>
            ) : (
              <YesNoDonutChart
                yesTraders={participationChartData?.yesTraders || 0}
                noTraders={participationChartData?.noTraders || 0}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
