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
