"use client";

import { BACKEND_URL } from "@/lib/config";
import axios from "axios";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import Decimal from "decimal.js";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import ProbabilityChart from "./ProbabilityChart";
import YesNoDonutChart from "./ParticipationChart";
import { TradingCard } from "./TradingCard";
import { useQueryClient, useQuery } from "@tanstack/react-query";
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
  const [currentTradesTab, setCurrentTradesTab] = useState<
    "UserTrades" | "Trades"
  >("Trades");

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
    data: marketTrades = [],
    isLoading: marketTradesLoading,
    error: marketTradesError,
  } = useQuery({
    queryKey: ["marketTrades", marketId],
    queryFn: () => getMarketTrades(marketId, data?.accessToken),
    enabled: isReady && currentTradesTab === "Trades",
  });
  const {
    data: userTrades = [],
    isLoading: userTradesLoading,
    error: userTradesError,
  } = useQuery({
    queryKey: ["userTrades", marketId],
    queryFn: () => getUserTrades(marketId, data?.accessToken),
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

      const newTrade = res.data.trade;
      queryClient.setQueryData<ITrade[]>(
        ["marketTrades", marketId],
        (old = []) => [newTrade, ...old]
      );

      queryClient.setQueryData<ITrade[]>(
        ["userTrades", marketId],
        (old = []) => [newTrade, ...old]
      );
      queryClient.invalidateQueries({ queryKey: ["marketInfo", marketId] });
      queryClient.invalidateQueries({ queryKey: ["position", marketId] });
      queryClient.invalidateQueries({ queryKey: ["balance"] });
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
    currentTradesTab === "UserTrades" ? userTrades : marketTrades;

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-lg bg-zinc-900 px-8 py-10">
          <div className="mb-6 space-y-2">
            <h2 className="text-2xl font-semibold text-zinc-100">
              {marketData.opinion}
            </h2>
            <p className="text-base text-zinc-500">{marketData.description}</p>
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
                  <div className="h-2 w-2 rounded-full bg-chart-1" />
                  <span className="text-sm font-semibold text-chart-1">
                    {marketData.yesPool}
                  </span>
                </div>
                <span className="text-xs text-zinc-500">•</span>
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-chart-2" />
                  <span className="text-sm font-semibold text-chart-2">
                    {marketData.noPool}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8 rounded-lg border border-zinc-800  bg-zinc-900 px-4 py-2">
          {probabilityChartDataLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="animate-spin text-zinc-500" />
            </div>
          ) : probabilityChartDataError ? (
            <div className="flex h-64 items-center justify-center">
              <p className="text-sm text-destructive">
                Failed to load probability chart
              </p>
            </div>
          ) : (
            <ProbabilityChart
              data={probabilityChartData}
              setChartInterval={setChartInterval}
            />
          )}
        </div>

        <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
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
              <div className="rounded-lg  bg-zinc-900 text-center py-8 ">
                <div className="mb-4 text-4xl">⏳</div>
                <h3 className="mb-2 text-lg font-semibold text-zinc-100">
                  Market Closed
                </h3>
                <p className="mb-3 text-sm text-zinc-500">
                  Trading has ended. The admin will resolve the outcome soon.
                </p>
                <p className="text-xs text-zinc-500">
                  You'll be able to claim your payout after resolution.
                </p>
              </div>
            ) : (
              <div className="space-y-4 rounded-lg   bg-zinc-900  px-4 py-8">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">✅</span>
                  <h3 className="text-lg font-semibold text-zinc-100">
                    Market Resolved
                  </h3>
                </div>

                {checking ? (
                  <p className="text-sm text-zinc-500">
                    Checking payout eligibility...
                  </p>
                ) : eligibilityError ? (
                  <p className="text-sm text-destructive">
                    Failed to check payout eligibility
                  </p>
                ) : eligibility && eligibility.participated ? (
                  eligibility.payoutStatus === "CLAIMED" ? (
                    <>
                      <p className="text-sm text-zinc-500">
                        Your payout for this market has already been
                        successfully claimed.
                      </p>
                      <Button disabled className="w-full">
                        Payout Claimed
                      </Button>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-zinc-500">
                        You are eligible to claim your payout based on your
                        final market position.
                      </p>
                      <div className="space-y-3">
                        <p className="text-sm text-zinc-500">
                          Amount to be claimed:{" "}
                          <span className="font-semibold text-zinc-100">
                            ${eligibility.payoutAmount}
                          </span>
                        </p>
                        <Button onClick={handleClaimPayout} className="w-full">
                          Claim Payout
                        </Button>
                      </div>
                    </>
                  )
                ) : (
                  <p className="text-sm text-destructive">
                    You are not eligible to claim a payout because you did not
                    participate in this market.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="rounded-lg  bg-zinc-900 px-4 py-2">
            <h3 className="mb-4 text-lg font-semibold text-zinc-100">
              Your Position
            </h3>

            {positionLoading || balanceLoading ? (
              <div className="flex items-center gap-2 text-zinc-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Loading your position…</span>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-lg   bg-zinc-900 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    YES Shares
                  </p>
                  <p className="mt-2 text-3xl font-bold text-chart-1">
                    {position?.yesShares ?? 0}
                  </p>
                </div>
                <div className="rounded-lg   bg-zinc-900 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    NO Shares
                  </p>
                  <p className="mt-2 text-3xl font-bold text-chart-2">
                    {position?.noShares ?? 0}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mb-8 rounded-lg bg-zinc-900 px-4 py-2">
          <h3 className="mb-6 text-lg font-semibold text-zinc-100">
            Liquidity Distribution
          </h3>
          <div className="space-y-4">
            <div className="flex h-2 overflow-hidden rounded-full bg-secondary">
              <div
                className="bg-chart-1 transition-all duration-300"
                style={{ width: `${marketData.probability.yes}%` }}
              />
              <div
                className="bg-chart-2 transition-all duration-300"
                style={{ width: `${marketData.probability.no}%` }}
              />
            </div>
            <div className="flex justify-between text-sm font-medium">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-chart-1" />
                <span className="text-zinc-100">
                  YES {Number(marketData.probability.yes).toFixed(2)}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-chart-2" />
                <span className="text-zinc-100">
                  NO {Number(marketData.probability.no).toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8 rounded-lg bg-zinc-900 overflow-hidden px-4 py-2">
          <div className="border-b  py-4">
            <div className="flex gap-4">
              {["Trades", "UserTrades"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setCurrentTradesTab(tab as any)}
                  className={`pb-2 text-sm font-semibold transition-colors ${
                    currentTradesTab === tab
                      ? "border-b-2 border-white text-white"
                      : "text-zinc-500 hover:text-zinc-100"
                  }`}
                >
                  {tab === "Trades" ? "Market Trades" : "Your Trades"}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="">
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
                {marketTradesLoading || userTradesLoading ? (
                  <TableRow className=" hover:bg-transparent">
                    <TableCell colSpan={5} className="py-8 text-center">
                      <Loader2 className="mx-auto inline-block animate-spin text-zinc-500" />
                    </TableCell>
                  </TableRow>
                ) : marketTradesError || userTradesError ? (
                  <TableRow className=" hover:bg-transparent">
                    <TableCell
                      colSpan={5}
                      className="py-8 text-center text-sm text-destructive"
                    >
                      Failed to load trades
                    </TableCell>
                  </TableRow>
                ) : displayedTrades && displayedTrades.length > 0 ? (
                  displayedTrades.map((trade: ITrade) => (
                    <TableRow key={trade.id} className=" hover:bg-secondary/30">
                      <TableCell className="font-medium text-zinc-100">
                        {trade.action}
                      </TableCell>
                      <TableCell>
                        <span
                          className={
                            trade.side === "YES"
                              ? "font-medium text-chart-1"
                              : "font-medium text-chart-2"
                          }
                        >
                          {trade.side}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium text-zinc-100">
                        {trade.amountIn}
                      </TableCell>
                      <TableCell className="font-medium text-zinc-100">
                        {trade.amountOut}
                      </TableCell>
                      <TableCell className="text-sm text-zinc-500">
                        {new Intl.DateTimeFormat("en-US", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(trade.createdAt))}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow className=" hover:bg-transparent">
                    <TableCell
                      colSpan={5}
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

        <div className="rounded-lg  bg-zinc-900 px-4 py-2">
          <h3 className="mb-6 text-lg font-semibold text-zinc-100">
            Trader Distribution
          </h3>
          <div className="flex h-80 items-center justify-center rounded-lg bg-zinc-800">
            {participationChartDataLoading ? (
              <Loader2 className="animate-spin text-zinc-500" />
            ) : participationChartDataError ? (
              <p className="text-sm text-destructive">Failed to load data</p>
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
