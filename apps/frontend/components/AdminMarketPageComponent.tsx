"use client";

import { BACKEND_URL } from "@/lib/config";
import axios from "axios";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface IMarket {
  opinion: string;
  description: string;
  expiryTime: string;
  yesPool: string;
  noPool: string;
  adminId: string;
}

interface FetchMarketResponse {
  data: IMarket;
}

interface IPosition {
  id: string;
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
  side: "YES" | "NO";
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

export default function AdminMarketPageComponent({
  marketId,
}: {
  marketId: string;
}) {
  const { data, status } = useSession();

  const [marketData, setMarketData] = useState<IMarket | null>(null);
  const [positions, setPositions] = useState<IPosition[]>([]);
  const [trades, setTrades] = useState<ITrade[]>([]);

  const fetchMarketInfo = async () => {
    try {
      const res = await axios.get<FetchMarketResponse>(
        `${BACKEND_URL}/markets/${marketId}`,
        {
          headers: {
            Authorization: `Bearer ${data?.accessToken}`,
          },
        }
      );

      setMarketData(res.data.data);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message);
    }
  };

  const fetchMarketPositionsAndTrades = async () => {
    try {
      const res = await axios.get<FetchMarketPositionsAndTradesResponse>(
        `${BACKEND_URL}/admin/markets/${marketId}/positions-and-trades`,
        {
          headers: {
            Authorization: `Bearer ${data?.accessToken}`,
          },
        }
      );

      setPositions(res.data.data.positions);
      setTrades(res.data.data.trades);
    } catch (error: any) {
      toast.error(error.response.data.message || error.message, {
        position: "top-center",
      });
    }
  };

  useEffect(() => {
    if (marketId && status === "authenticated") {
      fetchMarketInfo();
      fetchMarketPositionsAndTrades();
    }
  }, [marketId, status]);

  if (!marketData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-xl bg-white rounded-xl shadow-md p-6 space-y-6">
        <div className="space-y-2">
          <h1 className="text-xl font-semibold">{marketData.opinion}</h1>
          <p className="text-gray-600">{marketData.description}</p>
          <div className="text-sm text-gray-500">
            Expiry: {marketData.expiryTime}
          </div>
          <div className="flex gap-4 text-sm">
            <span>Yes Pool: {marketData.yesPool}</span>
            <span>No Pool: {marketData.noPool}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
