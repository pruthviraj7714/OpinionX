"use client";

import { useState } from "react";
import {
  User,
  Wallet,
  TrendingUp,
  Trophy,
  Activity,
  Clock,
  CheckCircle2,
  XCircle,
  Target,
  BarChart3,
  Sparkles,
  Award,
  Calendar,
  Loader2,
  Eye,
  Mail,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
} from "lucide-react";
import { fetchUserProfileAccountOverview } from "@/lib/api/user.api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { BACKEND_URL } from "@/lib/config";
import { toast } from "sonner";

interface ITrade {
  id: string;
  side: "YES" | "NO";
  action: "BUY" | "SELL";
  amountIn: number;
  amountOut: number;
  price: number;
  createdAt: Date;
  market: {
    opinion: string;
  };
}

interface IResolvedPosition {
  id: string;
  yesShares: number;
  noShares: number;
  payoutStatus: "CLAIMED" | "UNCLAIMED" | null;
  payoutAmount: number;
  claimedAt: Date;
  won: boolean;
  market: {
    id: string;
    opinion: string;
    description: string;
    resolvedOutcome: "YES" | "NO";
    updatedAt: Date;
  };
}

interface IOpenPosition {
  id: string;
  yesShares: number;
  noShares: number;
  market: {
    id: string;
    opinion: string;
    description: string;
    expiryTime: string;
    status: "OPEN" | "CLOSED" | "RESOLVED";
    probability: {
      yes: number;
      no: number;
    };
  };
  estimatedValue: number;
}

interface IPayout {
  id: string;
  amount: number;
  market: {
    opinion: string;
    resolvedOutcome: "YES" | "NO";
  };
}

export default function UserProfilePage({ authToken }: { authToken: string }) {
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const {
    data: profileData,
    isLoading: profileDataLoading,
    error: profileDataError,
  } = useQuery({
    queryKey: ["accountOverview"],
    queryFn: () => fetchUserProfileAccountOverview(authToken),
    enabled: !!authToken,
  });

  const queryClient = useQueryClient();

  const handleClaimPayout = async (payoutId: string) => {
    setClaimingId(payoutId);

    try {
      const res = await axios.post(
        `${BACKEND_URL}/user/claim-payout?payoutId=${payoutId}`,
        {},
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      toast.success(res.data.message, { position: "top-center" });
      await queryClient.invalidateQueries({ queryKey: ["accountOverview"] });
    } catch (error: any) {
      toast.error(error.response.data.message || error.message);
    } finally {
      setClaimingId(null);
    }
  };

  if (profileDataLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-zinc-950">
        <Loader2 className="animate-spin w-10 h-10 text-zinc-300" />
        <p className="text-zinc-400 text-sm">Loading User Profile...</p>
      </div>
    );
  }

  if (profileDataError) {
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
                  <User className="h-10 w-10 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-zinc-100 mb-1">
                    {profileData?.user?.username || "Trader"}
                  </h1>
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <Mail className="h-4 w-4" />
                    {profileData?.user?.email || "trader@example.com"}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30">
                      <CheckCircle2 className="h-3 w-3" />
                      Active Trader
                    </span>
                    <span className="text-xs text-zinc-500">
                      Member since{" "}
                      {new Date(
                        profileData.user.memberSince
                      ).toLocaleDateString()}
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
              <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-purple-400" />
              </div>
              <Eye className="h-4 w-4 text-zinc-500" />
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
              Available Balance
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-zinc-100">
                $
                {Number(profileData.balance || 0).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              <span className="text-sm text-zinc-500">USD</span>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-blue-400" />
              </div>
              <span className="text-xs font-semibold px-2 py-1 rounded bg-blue-500/20 text-blue-400">
                {profileData.positions.open?.length || 0}
              </span>
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
              Open Positions
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-zinc-100">
                $
                {profileData.stats.totalOpenValue.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              <span className="text-sm text-zinc-500">EST</span>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <Trophy className="h-5 w-5 text-emerald-400" />
              </div>
              <span className="text-xs font-semibold px-2 py-1 rounded bg-emerald-500/20 text-emerald-400">
                {profileData.payouts.claimable?.length || 0}
              </span>
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
              Claimable Payouts
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-emerald-400">
                ${profileData.payouts.totalClaimableAmount.toLocaleString()}
              </p>
              <span className="text-sm text-zinc-500">USD</span>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 rounded-lg bg-pink-500/20 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-pink-400" />
              </div>
              <Award className="h-4 w-4 text-zinc-500" />
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
              Total Volume
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-zinc-100">
                $
                {profileData.stats.totalVolume.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              <span className="text-sm text-zinc-500">
                {profileData.stats.marketsTraded} markets
              </span>
            </div>
          </div>
        </div>

        {profileData.payouts.claimable &&
          profileData.payouts.claimable.length > 0 && (
            <div className="mb-8 rounded-xl border border-emerald-800 bg-emerald-950/30 overflow-hidden">
              <div className="bg-linear-to-r from-emerald-600/20 to-emerald-500/20 px-6 py-4 border-b border-emerald-800/50">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-emerald-400" />
                  <h2 className="text-lg font-bold text-emerald-100">
                    Available Payouts
                  </h2>
                  <span className="ml-auto text-sm text-emerald-400 font-semibold">
                    ${profileData.payouts.totalClaimableAmount.toLocaleString()}{" "}
                    total
                  </span>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {profileData.payouts.claimable.map((payout: IPayout) => (
                    <div
                      key={payout.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-emerald-600/50 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                          <Sparkles className="h-6 w-6 text-emerald-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-zinc-100 mb-1">
                            {payout.market.opinion}
                          </h3>
                          <p className="text-sm text-zinc-400">
                            Resolved as{" "}
                            <span
                              className={
                                payout.market.resolvedOutcome === "YES"
                                  ? "text-emerald-400 font-bold"
                                  : "text-red-400 font-bold"
                              }
                            >
                              {payout.market.resolvedOutcome}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-emerald-400">
                            ${Number(payout.amount).toLocaleString()}
                          </p>
                          <p className="text-xs text-zinc-500">Payout amount</p>
                        </div>
                        <button
                          onClick={() => handleClaimPayout(payout.id)}
                          disabled={claimingId === payout.id}
                          className="px-6 py-3 bg-linear-to-r cursor-pointer from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-bold rounded-lg transition-all shadow-lg shadow-emerald-600/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {claimingId === payout.id ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Claiming...
                            </>
                          ) : (
                            "Claim"
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        {profileData.activity.recentTrades &&
          profileData.activity.recentTrades.length > 0 && (
            <div className="mb-8 rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
              <div className="bg-zinc-800/50 px-6 py-4 border-b border-zinc-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-400" />
                    <h2 className="text-lg font-bold text-zinc-100">
                      Recent Activity
                    </h2>
                  </div>
                  <span className="text-sm text-zinc-500">
                    Last {profileData.activity.recentTrades.length} trades
                  </span>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {profileData.activity.recentTrades.map((trade: ITrade) => (
                    <div
                      key={trade.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/50 border border-zinc-700/50"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                            trade.action === "BUY"
                              ? "bg-emerald-500/20"
                              : "bg-red-500/20"
                          }`}
                        >
                          {trade.action === "BUY" ? (
                            <ArrowUpRight className="h-5 w-5 text-emerald-400" />
                          ) : (
                            <ArrowDownRight className="h-5 w-5 text-red-400" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-zinc-100 text-sm mb-1">
                            {trade.action} {trade.side} @ $
                            {trade.price.toFixed(2)}
                          </h3>
                          <p className="text-xs text-zinc-400">
                            {trade.market.opinion}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-zinc-100">
                          ${trade.amountIn.toFixed(2)}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {new Date(trade.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        <div className="mb-8 rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
          <div className="bg-zinc-800/50 px-6 py-4 border-b border-zinc-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-400" />
                <h2 className="text-lg font-bold text-zinc-100">
                  Open Positions
                </h2>
              </div>
              <span className="text-sm text-zinc-500">
                {profileData.positions.open?.length || 0} active
              </span>
            </div>
          </div>

          <div className="p-6">
            {profileData.positions.open &&
            profileData.positions.open.length > 0 ? (
              <div className="space-y-3">
                {profileData.positions.open.map((position: IOpenPosition) => (
                  <div
                    key={position.id}
                    className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg bg-zinc-800/50 border border-zinc-700/50 hover:border-zinc-600 transition-all gap-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-zinc-100">
                          {position.market.opinion}
                        </h3>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/20 text-emerald-400">
                          <Clock className="h-3 w-3" />
                          {position.market.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm flex-wrap">
                        <div className="flex items-center gap-1">
                          <span className="text-zinc-500">YES:</span>
                          <span className="font-bold text-emerald-400">
                            {position.yesShares} (
                            {position.market.probability.yes.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-zinc-500">NO:</span>
                          <span className="font-bold text-red-400">
                            {position.noShares} (
                            {position.market.probability.no.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-zinc-500" />
                          <span className="text-zinc-500">
                            Expires{" "}
                            {new Date(
                              position.market.expiryTime
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs text-zinc-500 mb-1">Est. Value</p>
                        <p className="text-xl font-bold text-zinc-100">
                          ${position.estimatedValue.toFixed(2)}
                        </p>
                      </div>
                      <button className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-100 font-medium rounded-lg transition-all">
                        View Market
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Target className="h-16 w-16 text-zinc-700 mx-auto mb-4" />
                <p className="text-zinc-500 mb-2">No open positions</p>
                <p className="text-sm text-zinc-600">
                  Start trading to build your portfolio
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
          <div className="bg-zinc-800/50 px-6 py-4 border-b border-zinc-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-purple-400" />
                <h2 className="text-lg font-bold text-zinc-100">
                  Resolved Positions
                </h2>
              </div>
              <span className="text-sm text-zinc-500">
                {profileData.positions.resolved?.length || 0} completed
              </span>
            </div>
          </div>

          <div className="p-6">
            {profileData.positions.resolved &&
            profileData.positions.resolved.length > 0 ? (
              <div className="space-y-3">
                {profileData.positions.resolved.map(
                  (position: IResolvedPosition) => (
                    <div
                      key={position.id}
                      className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg bg-zinc-800/50 border border-zinc-700/50 gap-4"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-zinc-100">
                            {position.market.opinion}
                          </h3>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${
                              position.market.resolvedOutcome === "YES"
                                ? "bg-emerald-500/20 text-emerald-400"
                                : "bg-red-500/20 text-red-400"
                            }`}
                          >
                            {position.market.resolvedOutcome === "YES" ? (
                              <CheckCircle2 className="h-3 w-3" />
                            ) : (
                              <XCircle className="h-3 w-3" />
                            )}
                            {position.market.resolvedOutcome}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm flex-wrap">
                          <div className="flex items-center gap-1">
                            <span className="text-zinc-500">Had YES:</span>
                            <span className="font-bold text-emerald-400">
                              {position.yesShares}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-zinc-500">Had NO:</span>
                            <span className="font-bold text-red-400">
                              {position.noShares}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-zinc-500" />
                            <span className="text-zinc-500">
                              Resolved{" "}
                              {new Date(
                                position.market.updatedAt
                              ).toLocaleDateString()}
                            </span>
                          </div>
                          {position.won && (
                          <div className="flex items-center px-3 py-2 bg-emerald-500/20 rounded-lg">
                            <span className="text-sm font-bold text-emerald-400">
                              Amount Claimed : {position.payoutAmount}
                            </span>
                            <DollarSign className="h-4 w-4 text-emerald-400" />
                          </div>)}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xs text-zinc-500 mb-1">
                            Payout Status
                          </p>
                          <p
                            className={`text-sm font-bold ${
                              position.payoutStatus === "CLAIMED"
                                ? "text-emerald-400"
                                : position.payoutStatus === "UNCLAIMED"
                                  ? "text-amber-400"
                                  : "text-zinc-500"
                            }`}
                          >
                            {position.payoutStatus || "N/A"}
                          </p>
                        </div>
                        {position.won ? (
                          <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/20 rounded-lg">
                            <Trophy className="h-4 w-4 text-emerald-400" />
                            <span className="text-sm font-bold text-emerald-400">
                              Won
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 px-3 py-2 bg-zinc-700 rounded-lg">
                            <XCircle className="h-4 w-4 text-zinc-500" />
                            <span className="text-sm font-medium text-zinc-500">
                              Lost
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <CheckCircle2 className="h-16 w-16 text-zinc-700 mx-auto mb-4" />
                <p className="text-zinc-500 mb-2">No resolved positions</p>
                <p className="text-sm text-zinc-600">
                  Your completed markets will appear here
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
