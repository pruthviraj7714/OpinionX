import { api } from "./axios";

interface IMarket {
  id: string;
  opinion: string;
  description: string;
  expiryTime: string;
  status: "OPEN" | "RESOLVED" | "CLOSED";
  resolvedOutcome: null | "YES" | "NO";
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface PaginatedMarketsResponse {
  page: number;
  limit: number;
  totalMarkets: number;
  totalPages: number;
  markets: IMarket[];
}
interface IPosition {
  id: string;
  user: {
    username: string;
  };
  createdAt: Date;
  marketId: string;
  noShares: string;
  updatedAt: Date;
  userId: string;
  yesShares: string;
}

interface ITrade {
  id: string;
  userId: string;
  marketId: string;
  user: {
    username: string;
  };
  side: "YES" | "NO";
  action: "BUY" | "SELL";
  amountIn: string;
  amountOut: string;
  price: string;
  createdAt: Date;
}

interface FetchMarketPositionsAndTradesResponse {
  data: {
    positions: IPosition[];
    trades: ITrade[];
  };
}

export const fetchMarketsForAdmin = async (
  pageNumber: number = 1,
  token?: string
): Promise<PaginatedMarketsResponse> => {
  const { data } = await api.get(`/admin/markets?page=${pageNumber}&limit=10`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return data;
};

export const getMarketInfoForAdmin = async (
  marketId: string,
  token?: string
) => {
  const { data } = await api.get(`/admin/markets/${marketId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return data;
};

export const getMarketPositionsAndTrades = async (
  marketId: string,
  token?: string
): Promise<FetchMarketPositionsAndTradesResponse> => {
  const { data } = await api.get(
    `/admin/markets/${marketId}/positions-and-trades`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return data;
};
