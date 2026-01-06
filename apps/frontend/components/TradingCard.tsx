"use client"

import { Decimal } from "decimal.js"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface TradingCardProps {
  currentTab: "BUY" | "SELL"
  setCurrentTab: (tab: "BUY" | "SELL") => void
  currentSharesTab: "YES" | "NO"
  setCurrentSharesTab: (tab: "YES" | "NO") => void
  amount: string
  setAmount: (amount: string) => void
  balance: string
  amountToRecieve: Decimal
  onMax: () => void
  onTrade: () => void
}

export function TradingCard({
  currentTab,
  setCurrentTab,
  currentSharesTab,
  setCurrentSharesTab,
  amount,
  setAmount,
  balance,
  amountToRecieve,
  onMax,
  onTrade,
}: TradingCardProps) {
  return (
    <div className="lg:col-span-1 rounded-2xl border border-zinc-700 bg-zinc-800/50 backdrop-blur p-6 space-y-5">
      <div className="flex gap-2 bg-zinc-900/50 p-1 rounded-lg border border-zinc-700">
        {(["BUY", "SELL"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setCurrentTab(tab)}
            className={`flex-1 py-2 px-4 font-semibold rounded-md transition-all duration-200 ${
              currentTab === tab
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                : "bg-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex gap-2 bg-zinc-900/50 p-1 rounded-lg border border-zinc-700">
        {(["YES", "NO"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setCurrentSharesTab(tab)}
            className={`flex-1 py-2 px-4 font-semibold rounded-md transition-all duration-200 ${
              currentSharesTab === tab
                ? tab === "YES"
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/30"
                  : "bg-red-600 text-white shadow-lg shadow-red-500/30"
                : "bg-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-700">
        <div className="flex justify-between items-center">
          <span className="text-sm text-zinc-400">Available Balance</span>
          <span className="font-semibold text-white">${new Decimal(balance).toFixed(2)}</span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <label className="text-sm font-semibold text-white">
            Amount to {currentTab} {currentSharesTab}
          </label>
          <button
            onClick={onMax}
            className="text-xs font-semibold bg-zinc-700 hover:bg-zinc-600 text-white px-3 py-1 rounded-full transition-colors"
          >
            MAX
          </button>
        </div>
        <Input
          type="number"
          min={0}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter amount"
          className="bg-zinc-900/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-blue-500 focus:ring-blue-500/30"
        />
        <p className="text-sm text-zinc-400">
          You&apos;ll receive ≈ <span className="font-semibold text-white">{amountToRecieve.toString()}</span>
        </p>
      </div>

      <Button
        onClick={onTrade}
        disabled={!amount || Number(amount) <= 0}
        className={`w-full py-6 font-semibold text-lg rounded-lg transition-all duration-200 ${
          currentTab === "BUY"
            ? "bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50"
            : "bg-orange-600 hover:bg-orange-700 disabled:bg-orange-600/50"
        }`}
      >
        {currentTab} {currentSharesTab}
      </Button>
    </div>
  )
}
