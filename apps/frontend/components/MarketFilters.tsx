import { IMarketFilters } from "@/hooks/useMarketFilters";
import { Search, Filter, SortAsc, TrendingUp, Calendar, DollarSign, Users, X } from "lucide-react";
import { useState } from "react";

export default function MarketFilters({ 
  searchInput, 
  setSearchInput, 
  marketStatus, 
  setMarketStatus,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  filterByOutcome,
  setFilterByOutcome,
  minLiquidity,
  setMinLiquidity,
  maxLiquidity,
  setMaxLiquidity,
  dateRange,
  setDateRange,
  onReset
} : IMarketFilters) {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search markets by opinion or description..."
            className="w-full pl-10 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder:text-zinc-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all outline-none"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            autoFocus
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="relative min-w-[180px]">
          <select
            value={marketStatus}
            onChange={(e) => setMarketStatus(e.target.value)}
            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all outline-none appearance-none cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="OPEN">🟢 Open</option>
            <option value="CLOSED">🟡 Closed</option>
            <option value="RESOLVED">🔵 Resolved</option>
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg className="h-4 w-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        <div className="relative min-w-[200px]">
          <SortAsc className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full pl-10 pr-10 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all outline-none appearance-none cursor-pointer"
          >
            <option value="createdAt">Recently Created</option>
            <option value="expiryTime">Expiry Date</option>
            <option value="liquidity">Total Liquidity</option>
            <option value="traders">Most Traders</option>
            <option value="volume">Trading Volume</option>
            <option value="popularity">Popularity</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
            title={sortOrder === "asc" ? "Ascending" : "Descending"}
          >
            <svg 
              className={`h-4 w-4 transition-transform ${sortOrder === "desc" ? "rotate-180" : ""}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
        </div>

        <button
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className={`px-4 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
            showAdvancedFilters
              ? "bg-purple-600 text-white"
              : "bg-zinc-800 border border-zinc-700 text-zinc-100 hover:bg-zinc-700"
          }`}
        >
          <Filter className="h-4 w-4" />
          <span className="hidden sm:inline">Filters</span>
        </button>
      </div>

      {showAdvancedFilters && (
        <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-6 space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
              <Filter className="h-5 w-5 text-purple-400" />
              Advanced Filters
            </h3>
            <button
              onClick={onReset}
              className="text-sm text-zinc-400 hover:text-purple-400 transition-colors"
            >
              Reset All
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
                <TrendingUp className="h-4 w-4 text-purple-400" />
                Resolved Outcome
              </label>
              <select
                value={filterByOutcome}
                onChange={(e) => setFilterByOutcome(e.target.value)}
                className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all outline-none appearance-none cursor-pointer"
              >
                <option value="">All Outcomes</option>
                <option value="YES">✅ YES</option>
                <option value="NO">❌ NO</option>
                <option value="PENDING">⏳ Pending</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
                <DollarSign className="h-4 w-4 text-purple-400" />
                Min Liquidity
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
                <input
                  type="number"
                  placeholder="0"
                  value={minLiquidity}
                  onChange={(e) => setMinLiquidity(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 placeholder:text-zinc-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
                <DollarSign className="h-4 w-4 text-purple-400" />
                Max Liquidity
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
                <input
                  type="number"
                  placeholder="∞"
                  value={maxLiquidity}
                  onChange={(e) => setMaxLiquidity(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 placeholder:text-zinc-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
                <Calendar className="h-4 w-4 text-purple-400" />
                Expiry Date Range
              </label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all outline-none appearance-none cursor-pointer"
              >
                <option value="">All Dates</option>
                <option value="24h">Next 24 Hours</option>
                <option value="7d">Next 7 Days</option>
                <option value="30d">Next 30 Days</option>
                <option value="90d">Next 90 Days</option>
                <option value="expired">Already Expired</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
                <DollarSign className="h-4 w-4 text-purple-400" />
                Max Fee Percent
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  placeholder="Any"
                  className="w-full px-4 pr-8 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 placeholder:text-zinc-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all outline-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500">%</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
                <Users className="h-4 w-4 text-purple-400" />
                Min Traders
              </label>
              <input
                type="number"
                placeholder="0"
                className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 placeholder:text-zinc-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all outline-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-700">
            <div className="flex flex-wrap gap-2">
              {searchInput && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">
                  Search: {searchInput}
                  <button onClick={() => setSearchInput("")} className="hover:text-purple-100">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {marketStatus && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">
                  Status: {marketStatus}
                  <button onClick={() => setMarketStatus("")} className="hover:text-purple-100">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {filterByOutcome && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">
                  Outcome: {filterByOutcome}
                  <button onClick={() => setFilterByOutcome("")} className="hover:text-purple-100">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {(minLiquidity || maxLiquidity) && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">
                  Liquidity: ${minLiquidity || "0"} - ${maxLiquidity || "∞"}
                  <button onClick={() => { setMinLiquidity(""); setMaxLiquidity(""); }} className="hover:text-purple-100">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {dateRange && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">
                  Date: {dateRange}
                  <button onClick={() => setDateRange("")} className="hover:text-purple-100">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}