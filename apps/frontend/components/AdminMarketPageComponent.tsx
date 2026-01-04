"use client";

import { BACKEND_URL } from "@/lib/config";
import axios from "axios";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";

interface IMarket {
  opinion: string;
  description: string;
  expiryTime: string;
  yesPool: string;
  noPool: string;
  adminId: string;
  status: "OPEN" | "RESOLVED" | "CLOSED";
}

type FetchMarketResponse = IMarket;

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
  action : "BUY" | "SELL";
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
  const [selectedOutcome, setSelectedOutcome] = useState<"YES" | "NO" | null>(
    null
  );

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

      setMarketData(res.data);
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

  const handleResolveOutCome = async () => {
    if (
      !window.confirm(
        "are you sure you want to resolve the market with current outcome \nNote: You Cannot modify it later"
      )
    )
      return;

    try {
      const res = await axios.post(
        `${BACKEND_URL}/admin/markets/${marketId}/resolve`,
        {
          outcome : selectedOutcome,
        },
        {
          headers: {
            Authorization: `Bearer ${data?.accessToken}`,
          },
        }
      );

      toast.success(res.data.message);
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

  const isExpired =
    Date.now() > new Date(marketData.expiryTime).getTime() &&
    marketData.status === "CLOSED";

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

          <div className="flex flex-col justify-center items-center">
            <span>Resolve Outcome:</span>
            <div className="flex gap-4 items-center">
              <Button
                disabled={!isExpired}
                onClick={() => setSelectedOutcome("YES")}
                className={`${selectedOutcome === "YES" ? "bg-green-400 hover:bg-green-500" : "bg-black text-white"} text-white cursor-pointer disabled:bg-gray-400`}
              >
                Yes
              </Button>
              <Button
                disabled={!isExpired}
                onClick={() => setSelectedOutcome("NO")}
                className={`${selectedOutcome === "NO" ? "bg-red-400 hover:bg-red-500" : "bg-black text-white"} text-white cursor-pointer disabled:bg-gray-400`}
              >
                No
              </Button>
            </div>
            <Button className="my-4" onClick={handleResolveOutCome}>
              Submit Outcome
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
