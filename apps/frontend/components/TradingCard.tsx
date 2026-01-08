"use client";

import { Button } from "@/components/ui/button";
import Decimal from "decimal.js";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

interface TradingCardProps {
  currentTab: "BUY" | "SELL";
  setCurrentTab: (tab: "BUY" | "SELL") => void;
  currentSharesTab: "YES" | "NO";
  setCurrentSharesTab: (tab: "YES" | "NO") => void;
  amount: string;
  setAmount: (amount: string) => void;
  calculateFee: () => string;
  calculateFinal: () => string;
  calculateFinalReceivingAmount: () => string;
  balance: string;
  amountToReceive: string;
  onMax: () => void;
  onTrade: () => void;
  platformFees: string;
}

export function TradingCard({
  currentTab,
  setCurrentTab,
  currentSharesTab,
  setCurrentSharesTab,
  amount,
  setAmount,
  calculateFee,
  calculateFinal,
  calculateFinalReceivingAmount,
  balance,
  amountToReceive,
  onMax,
  onTrade,
  platformFees,
}: TradingCardProps) {
  const isBuy = currentTab === "BUY";
  const isYes = currentSharesTab === "YES";

  return (
    <div className="rounded-2xl bg-zinc-800 p-6 sm:p-8 border border-zinc-700">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100">Place Trade</h2>
          <p className="mt-1 text-sm text-zinc-400">
            {isBuy ? "Buy shares at current price" : "Sell your shares"}
          </p>
        </div>
        <div
          className={`rounded-full p-3 ${isBuy ? "bg-blue-500/10" : "bg-orange-500/10"}`}
        >
          <div
            className={`h-6 w-6 ${isBuy ? "text-blue-400" : "text-orange-400"}`}
          >
            {isBuy ? <ArrowDownLeft /> : <ArrowUpRight />}
          </div>
        </div>
      </div>

      <div className="space-y-4 mb-8">
        <div className="flex gap-2">
          {["BUY", "SELL"].map((tab) => (
            <button
              key={tab}
              onClick={() => setCurrentTab(tab as "BUY" | "SELL")}
              className={`flex-1 py-3 px-4 font-semibold rounded-lg transition-all duration-200 border ${
                currentTab === tab
                  ? tab === "BUY"
                    ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20"
                    : "bg-orange-600 text-white border-orange-600 shadow-lg shadow-orange-500/20"
                  : "bg-zinc-900 text-zinc-400 border-zinc-700 hover:bg-zinc-800"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          {["YES", "NO"].map((tab) => (
            <button
              key={tab}
              onClick={() => setCurrentSharesTab(tab as "YES" | "NO")}
              className={`flex-1 py-3 px-4 font-semibold rounded-lg transition-all duration-200 border ${
                currentSharesTab === tab
                  ? tab === "YES"
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-500/20"
                    : "bg-red-600 text-white border-red-600 shadow-lg shadow-red-500/20"
                  : "bg-zinc-900 text-zinc-400 border-zinc-700 hover:bg-zinc-800"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-8 rounded-lg bg-zinc-900 border border-zinc-700 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">
              Available Balance
            </p>
            <p className="mt-2 text-3xl font-bold text-zinc-100">
              ${new Decimal(balance || 0).toString()}
            </p>
          </div>
          <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center">
            <span className="text-2xl">⚡</span>
          </div>
        </div>
      </div>

      <div className="space-y-4 mb-8">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-zinc-100">
            {isBuy
              ? `Amount to ${currentTab} ${currentSharesTab}`
              : `${currentTab} ${currentSharesTab}`}
          </label>
          <button
            onClick={onMax}
            className="text-xs font-semibold bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 px-3 py-1.5 rounded-full transition-all hover:scale-105"
          >
            MAX
          </button>
        </div>

        <input
          type="number"
          min={0}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          className="w-full text-lg font-semibold h-12 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 placeholder:text-zinc-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all px-4 outline-none"
        />

        <div className="rounded-lg bg-zinc-900 border border-zinc-700 p-3 hover:border-zinc-600 transition-colors">
          <p className="text-sm text-zinc-400">
            Platform fees:{" "}
            <span className="font-semibold text-zinc-100">{platformFees}%</span>
          </p>
        </div>

        <div className="rounded-lg bg-zinc-900 border border-zinc-700 p-3 space-y-2 hover:border-zinc-600 transition-colors">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Amount:</span>
            <span className="font-semibold text-zinc-100">
              ${(isBuy ? amount : amountToReceive) || "0.00"}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Platform fees:</span>
            <span className="font-semibold text-red-400">
              -${calculateFee()}
            </span>
          </div>
          <div className="pt-2 border-t border-zinc-700">
            <div className="flex justify-between">
              <span className="text-sm text-zinc-400">Final amount:</span>
              <span className="font-semibold text-zinc-100">
                ${calculateFinal()}
              </span>
            </div>
          </div>
        </div>

        <div className="group relative rounded-xl bg-linear-to-br from-purple-500/5 via-pink-500/5 to-purple-500/5 border border-purple-500/20 p-4 hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300">
          <div className="absolute inset-0 rounded-xl bg-linear-to-br from-purple-500/0 to-pink-500/0 group-hover:from-purple-500/5 group-hover:to-pink-500/5 transition-all duration-300" />

          <div className="relative flex items-center justify-between">
            <p className="text-sm text-zinc-400 font-medium">You'll receive</p>

            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                ≈ {calculateFinalReceivingAmount()}
              </span>
              <span
                className={`text-sm font-semibold px-2.5 py-0.5 rounded-full ${
                  isBuy
                    ? isYes
                      ? "bg-green-500/20 text-green-400 ring-1 ring-green-500/30"
                      : "bg-red-500/20 text-red-400 ring-1 ring-red-500/30"
                    : "bg-purple-500/20 text-purple-400 ring-1 ring-purple-500/30"
                }`}
              >
                {isBuy ? (isYes ? "Yes Shares" : "No Shares") : "USD"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <Button
        onClick={onTrade}
        disabled={!amount || Number(amount) <= 0}
        className={`w-full py-6 font-semibold text-base text-white rounded-lg transition-all duration-200 ${
          currentTab === "BUY"
            ? "bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:text-zinc-500"
            : "bg-orange-600 hover:bg-orange-700 disabled:bg-zinc-700 disabled:text-zinc-500"
        }`}
      >
        {currentTab} {currentSharesTab}
      </Button>
    </div>
  );
}
