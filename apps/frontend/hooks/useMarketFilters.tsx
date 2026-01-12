import MarketFilters from "@/components/MarketFilters";
import { useState, useEffect, useMemo } from "react";

// Hook for managing all filter states
export function useMarketFilters() {
  // Search & Basic Filters
  const [searchInput, setSearchInput] = useState("");
  const [marketStatus, setMarketStatus] = useState(""); // "", "OPEN", "CLOSED", "RESOLVED"

  // Sorting
  const [sortBy, setSortBy] = useState("createdAt"); // "createdAt", "expiryTime", "liquidity", "traders", "volume", "popularity"
  const [sortOrder, setSortOrder] = useState("desc"); // "asc" or "desc"

  // Advanced Filters
  const [filterByOutcome, setFilterByOutcome] = useState(""); // "", "YES", "NO", "PENDING"
  const [minLiquidity, setMinLiquidity] = useState("");
  const [maxLiquidity, setMaxLiquidity] = useState("");
  const [dateRange, setDateRange] = useState(""); // "", "24h", "7d", "30d", "90d", "expired"
  const [maxFeePercent, setMaxFeePercent] = useState("");
  const [minTraders, setMinTraders] = useState("");

  // Additional useful filters
  const [showMyMarkets, setShowMyMarkets] = useState(false);
  const [showMyPositions, setShowMyPositions] = useState(false);
  const [createdBy, setCreatedBy] = useState("");

  // Reset all filters
  const onReset = () => {
    setSearchInput("");
    setMarketStatus("");
    setSortBy("createdAt");
    setSortOrder("desc");
    setFilterByOutcome("");
    setMinLiquidity("");
    setMaxLiquidity("");
    setDateRange("");
    setMaxFeePercent("");
    setMinTraders("");
    setShowMyMarkets(false);
    setShowMyPositions(false);
    setCreatedBy("");
  };

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return !!(
      searchInput ||
      marketStatus ||
      filterByOutcome ||
      minLiquidity ||
      maxLiquidity ||
      dateRange ||
      maxFeePercent ||
      minTraders ||
      showMyMarkets ||
      showMyPositions ||
      createdBy
    );
  }, [
    searchInput,
    marketStatus,
    filterByOutcome,
    minLiquidity,
    maxLiquidity,
    dateRange,
    maxFeePercent,
    minTraders,
    showMyMarkets,
    showMyPositions,
    createdBy,
  ]);

  return {
    // Search & Basic
    searchInput,
    setSearchInput,
    marketStatus,
    setMarketStatus,

    // Sorting
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,

    // Advanced Filters
    filterByOutcome,
    setFilterByOutcome,
    minLiquidity,
    setMinLiquidity,
    maxLiquidity,
    setMaxLiquidity,
    dateRange,
    setDateRange,
    maxFeePercent,
    setMaxFeePercent,
    minTraders,
    setMinTraders,

    // Additional Filters
    showMyMarkets,
    setShowMyMarkets,
    showMyPositions,
    setShowMyPositions,
    createdBy,
    setCreatedBy,

    // Utilities
    onReset,
    hasActiveFilters,
  };
}

// Function to filter markets based on all criteria
export function filterMarkets(markets, filters) {
  let filtered = [...markets];

  // Search filter
  if (filters.searchInput) {
    const search = filters.searchInput.toLowerCase();
    filtered = filtered.filter(
      (market) =>
        market.opinion.toLowerCase().includes(search) ||
        market.description.toLowerCase().includes(search)
    );
  }

  // Status filter
  if (filters.marketStatus) {
    filtered = filtered.filter(
      (market) => market.status === filters.marketStatus
    );
  }

  // Outcome filter
  if (filters.filterByOutcome) {
    if (filters.filterByOutcome === "PENDING") {
      filtered = filtered.filter((market) => !market.resolvedOutcome);
    } else {
      filtered = filtered.filter(
        (market) => market.resolvedOutcome === filters.filterByOutcome
      );
    }
  }

  // Liquidity filters
  if (filters.minLiquidity) {
    filtered = filtered.filter((market) => {
      const totalLiquidity = Number(market.yesPool) + Number(market.noPool);
      return totalLiquidity >= Number(filters.minLiquidity);
    });
  }

  if (filters.maxLiquidity) {
    filtered = filtered.filter((market) => {
      const totalLiquidity = Number(market.yesPool) + Number(market.noPool);
      return totalLiquidity <= Number(filters.maxLiquidity);
    });
  }

  // Date range filter
  if (filters.dateRange) {
    const now = new Date();
    filtered = filtered.filter((market) => {
      const expiryDate = new Date(market.expiryTime);
      const diffMs = expiryDate.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      const diffDays = diffHours / 24;

      switch (filters.dateRange) {
        case "24h":
          return diffHours > 0 && diffHours <= 24;
        case "7d":
          return diffDays > 0 && diffDays <= 7;
        case "30d":
          return diffDays > 0 && diffDays <= 30;
        case "90d":
          return diffDays > 0 && diffDays <= 90;
        case "expired":
          return diffMs < 0;
        default:
          return true;
      }
    });
  }

  // Fee percent filter
  if (filters.maxFeePercent) {
    filtered = filtered.filter(
      (market) => Number(market.feePercent) <= Number(filters.maxFeePercent)
    );
  }

  // Min traders filter
  if (filters.minTraders) {
    filtered = filtered.filter(
      (market) => market.noOfTraders >= Number(filters.minTraders)
    );
  }

  // Filter by creator
  if (filters.createdBy) {
    filtered = filtered.filter((market) => market.userId === filters.createdBy);
  }

  return filtered;
}

// Function to sort markets
export function sortMarkets(markets, sortBy, sortOrder) {
  const sorted = [...markets];

  sorted.sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case "createdAt":
        comparison =
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;

      case "expiryTime":
        comparison =
          new Date(a.expiryTime).getTime() - new Date(b.expiryTime).getTime();
        break;

      case "liquidity":
        const aLiquidity = Number(a.yesPool) + Number(a.noPool);
        const bLiquidity = Number(b.yesPool) + Number(b.noPool);
        comparison = aLiquidity - bLiquidity;
        break;

      case "traders":
        comparison = (a.noOfTraders || 0) - (b.noOfTraders || 0);
        break;

      case "volume":
        // Calculate total volume from trades if available
        const aVolume =
          a.trades?.reduce((sum, trade) => sum + Number(trade.amountIn), 0) ||
          0;
        const bVolume =
          b.trades?.reduce((sum, trade) => sum + Number(trade.amountIn), 0) ||
          0;
        comparison = aVolume - bVolume;
        break;

      case "popularity":
        // Popularity = combination of traders, liquidity, and volume
        const aPopularity =
          (a.noOfTraders || 0) * 10 + (Number(a.yesPool) + Number(a.noPool));
        const bPopularity =
          (b.noOfTraders || 0) * 10 + (Number(b.yesPool) + Number(b.noPool));
        comparison = aPopularity - bPopularity;
        break;

      default:
        comparison = 0;
    }

    return sortOrder === "asc" ? comparison : -comparison;
  });

  return sorted;
}

// Complete filtering and sorting function
export function processMarkets(markets, filters) {
  const filtered = filterMarkets(markets, filters);
  const sorted = sortMarkets(filtered, filters.sortBy, filters.sortOrder);
  return sorted;
}


export interface IMarketFilters {
  searchInput: string;
  setSearchInput: (value: string) => void;
  marketStatus: string;
  setMarketStatus: (value: string) => void;
  sortBy: string;
  setSortBy: (value: string) => void;
  sortOrder: string;
  setSortOrder: (value: string) => void;
  filterByOutcome: string;
  setFilterByOutcome: (value: string) => void;
  minLiquidity: string;
  setMinLiquidity: (value: string) => void;
  maxLiquidity: string;
  setMaxLiquidity: (value: string) => void;
  dateRange: string;
  setDateRange: (value: string) => void;
  maxFeePercent: string;
  setMaxFeePercent: (value: string) => void;
  minTraders: string;
  setMinTraders: (value: string) => void;
  showMyMarkets: boolean;
  setShowMyMarkets: (value: boolean) => void;
  showMyPositions: boolean;
  setShowMyPositions: (value: boolean) => void;
  createdBy: string;
  setCreatedBy: (value: string) => void;
  onReset: () => void;
  hasActiveFilters: boolean;
}

export interface Market {
  id: string;
  opinion: string;
  description: string;
  status: "OPEN" | "CLOSED" | "RESOLVED";
  expiryTime: string;
  resolvedOutcome?: "YES" | "NO" | null;
  feePercent: number;
  yesPool: number;
  noPool: number;
  userId: string;
  noOfTraders?: number;
  positions?: Array<{ userId: string }>;
  trades?: Array<{ amountIn: number }>;
  createdAt: string;
  updatedAt: string;
}
