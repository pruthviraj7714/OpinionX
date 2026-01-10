import { fetchUserTradesResponse } from "@/types/market";
import { api } from "./axios";
import {
  FetchUserBalanceResponse,
  FetchUserPositionResponse,
} from "@/types/user";

export const getUserBalance = async (
  token?: string
): Promise<FetchUserBalanceResponse> => {
  const { data } = await api.get(`/user/balance`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return data.balance;
};

export const getUserPosition = async (
  marketId: string,
  token?: string
): Promise<FetchUserPositionResponse> => {
  const { data } = await api.get(`/user/${marketId}/position`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return data.position;
};

export const getUserTrades = async (marketId: string, token?: string) => {
  const { data } = await api.get<fetchUserTradesResponse>(
    `/markets/${marketId}/trades/me`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return data.trades;
};

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

export const fetchMarkets = async (
  pageNumber: number = 1,
  token?: string
): Promise<PaginatedMarketsResponse> => {
  const { data } = await api.get(`/markets?page=${pageNumber}&limit=5`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return data;
};
