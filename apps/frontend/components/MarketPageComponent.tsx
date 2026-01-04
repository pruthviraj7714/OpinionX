"use client";

import { BACKEND_URL } from "@/lib/config";
import axios from "axios";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import Decimal from "decimal.js";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import ProbabilityChart from "./ProbabilityChart";

interface IMarket {
  opinion: string;
  description: string;
  expiryTime: string;
  yesPool: string;
  noPool: string;
  adminId: string;
  probability: {
    yes: string;
    no: string;
  };
  noOfTraders: number;
  trades: ITrade[];
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
  action: "BUY" | "SELL";
  amountIn: string;
  amountOut: string;
  price: string;
  createdAt: Date;
}

interface FetchUserPositionAndTradesResponse {
  data: {
    position: IPosition;
    trades: ITrade[];
  };
}

interface FetchUserBalanceResponse {
  balance: Decimal;
}

type YesNoBucket = {
  timestamp: string;
  yes: number;
  no: number;
};

export default function MarketPageComponent({
  marketId,
}: {
  marketId: string;
}) {
  const { data, status } = useSession();

  const [marketData, setMarketData] = useState<IMarket | null>(null);
  const [currentTab, setCurrentTab] = useState<"BUY" | "SELL">("BUY");
  const [currentSharesTab, setCurrentSharesTab] = useState<"YES" | "NO">("YES");
  const [amount, setAmount] = useState<string>("");
  const [amountToRecieve, setAmountToRecieve] = useState<Decimal>(
    new Decimal(0)
  );
  const [position, setPosition] = useState<IPosition | null>(null);
  const [trades, setTrades] = useState<ITrade[]>([]);
  const [balance, setBalance] = useState<Decimal>(new Decimal(0));
  const [marketTrades, setMarketTrades] = useState<ITrade[]>([]);
  const [probabilityChartData, setProbabilityChartData] = useState<YesNoBucket[]>([]);
  const [chartInterval, setChartInterval] = useState('5m');

  const fetchUserBalance = async () => {
    if (!data || !data.accessToken) return;
    try {
      const res = await axios.get<FetchUserBalanceResponse>(
        `${BACKEND_URL}/user/balance`,
        {
          headers: {
            Authorization: `Bearer ${data.accessToken}`,
          },
        }
      );

      setBalance(res.data.balance);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message);
    }
  };

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
      setMarketTrades(res.data.trades);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message);
    }
  };

  const handlePlaceTrade = async () => {
    try {
      const res = await axios.post(
        `${BACKEND_URL}/markets/${marketId}/trades`,
        {
          side: currentSharesTab,
          action: currentTab,
          amount,
        },
        {
          headers: {
            Authorization: `Bearer ${data?.accessToken}`,
          },
        }
      );
      toast.success(res.data.message, { position: "top-center" });
      fetchMarketInfo();
      fetchUserBalance();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message, {
        position: "top-center",
      });
    }
  };

  const handleCalculateRecievingAmount = () => {
    if (!marketData) return;

    let newYesPool;
    let newNoPool;
    let amountToBeRecieved;

    const k = new Decimal(marketData.yesPool).mul(
      new Decimal(marketData.noPool)
    );

    if (currentTab === "BUY" && currentSharesTab === "YES") {
      newNoPool = new Decimal(marketData.noPool).plus(amount);
      newYesPool = k.div(newNoPool);
      amountToBeRecieved = new Decimal(marketData.yesPool).minus(newYesPool);
    } else if (currentTab === "BUY" && currentSharesTab === "NO") {
      newYesPool = new Decimal(marketData.yesPool).plus(amount);
      newNoPool = k.div(newYesPool);
      amountToBeRecieved = new Decimal(marketData.noPool).minus(newNoPool);
    } else if (currentTab === "SELL" && currentSharesTab === "YES") {
      newYesPool = new Decimal(marketData.yesPool).plus(amount);
      newNoPool = k.div(newYesPool);
      amountToBeRecieved = new Decimal(marketData.noPool).minus(newNoPool);
    } else if (currentTab === "SELL" && currentSharesTab === "NO") {
      newNoPool = new Decimal(marketData.noPool).plus(amount);
      newYesPool = k.div(newNoPool);
      amountToBeRecieved = new Decimal(marketData.yesPool).minus(newYesPool);
    }

    setAmountToRecieve(amountToBeRecieved || new Decimal(0));
  };

  const fetchUserPositionAndTrades = async () => {
    try {
      const res = await axios.get<FetchUserPositionAndTradesResponse>(
        `${BACKEND_URL}/user/${marketId}/position-and-trades`,
        {
          headers: {
            Authorization: `Bearer ${data?.accessToken}`,
          },
        }
      );

      setTrades(res.data.data.trades);
      setPosition(res.data.data.position);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message, {
        position: "top-center",
      });
    }
  };

  const handleMax = () => {
    if (!position) return;

    if (currentTab === "BUY") {
      setAmount(balance.toString());
    } else {
      if (currentSharesTab === "YES") {
        setAmount(position.yesShares.toString());
      } else {
        setAmount(position.noShares.toString());
      }
    }
  };

  const fetchProbabilityChartData = async () => {
    try {
      const res = await axios.get(
        `${BACKEND_URL}/markets/${marketId}/charts/probability?interval=${chartInterval}`,
        {
          headers: {
            Authorization: `Bearer ${data?.accessToken}`,
          },
        }
      );
      setProbabilityChartData(res.data.points);
    } catch (error : any) {
      toast.error(error?.response?.data?.message || error?.message, {
        position: "top-center",
      });
    }
  }

  useEffect(() => {
    if (marketId && status === "authenticated") {
      fetchMarketInfo();
      fetchUserPositionAndTrades();
      fetchUserBalance();
      fetchProbabilityChartData();
    }
  }, [marketId, status]);

  useEffect(() => {
    if (!amount || amount.length === 0) return;

    let timeout = setTimeout(() => {
      handleCalculateRecievingAmount();
    }, 300);

    return () => {
      clearTimeout(timeout);
    };
  }, [amount, currentSharesTab, currentTab, marketData]);

  if (!marketData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin w-10 h-10" />
      </div>
    );
  }

  const expiryDate = new Date(marketData.expiryTime);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="bg-white rounded-xl shadow p-6 space-y-3">
          <h1 className="text-2xl font-semibold">{marketData.opinion}</h1>
          <p className="text-gray-600">{marketData.description}</p>
          <span>{marketData.noOfTraders} traders trading in this market</span>

          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
            <span>
              Expiry:{" "}
              {new Intl.DateTimeFormat("en-US", {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(expiryDate)}
            </span>
            <span>Yes Pool: {marketData.yesPool}</span>
            <span>No Pool: {marketData.noPool}</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="font-medium mb-2">Market Probability</h2>
          <div className="h-48 flex items-center justify-center text-gray-400">
            <ProbabilityChart data={probabilityChartData}  />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6 space-y-2">
          <h2 className="font-medium">Liquidity Distribution</h2>
          <div className="flex h-4 rounded overflow-hidden">
            <div
              className="bg-green-500"
              style={{ width: `${marketData.probability.yes}%` }}
            />
            <div
              className="bg-red-500"
              style={{ width: `${marketData.probability.no}%` }}
            />
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>YES</span>
            <span>NO</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white rounded-xl shadow p-6 space-y-5">
            <div className="flex rounded-lg overflow-hidden border">
              {(["BUY", "SELL"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setCurrentTab(tab)}
                  className={`flex-1 py-2 font-medium ${
                    currentTab === tab ? "bg-black text-white" : "bg-white"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="flex rounded-lg overflow-hidden border">
              {(["YES", "NO"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setCurrentSharesTab(tab)}
                  className={`flex-1 py-2 font-medium ${
                    currentSharesTab === tab
                      ? tab === "YES"
                        ? "bg-green-600 text-white"
                        : "bg-red-600 text-white"
                      : "bg-white"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center text-sm text-gray-600">
                <span>Available Balance</span>
                <span className="font-medium text-gray-900">
                  ${new Decimal(balance).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">
                  Amount to {currentTab} {currentSharesTab}
                </label>

                <button
                  onClick={handleMax}
                  className="text-xs cursor-pointer text-white font-semibold bg-black px-4 py-2 hover:bg-black/80 rounded-2xl"
                >
                  Max
                </button>
              </div>
              <Input
                type="number"
                min={0}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
              />
              <p className="text-sm text-gray-500">
                You’ll receive ≈ <b>{amountToRecieve.toString()}</b>
              </p>
            </div>

            <Button
              className="w-full"
              disabled={!amount || Number(amount) <= 0}
              onClick={handlePlaceTrade}
            >
              {currentTab} {currentSharesTab}
            </Button>
          </div>

          <div className="bg-white rounded-xl shadow p-6 space-y-2">
            <h2 className="font-medium">Your Position</h2>

            <div className="text-sm text-gray-600">
              <p>
                YES Shares: <b>{position?.yesShares ?? 0}</b>
              </p>
              <p>
                NO Shares: <b>{position?.noShares ?? 0}</b>
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <Table>
            <TableCaption>Your Trades</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Action</TableHead>
                <TableHead>Side</TableHead>
                <TableHead>Amount In</TableHead>
                <TableHead>Amount Out</TableHead>
                <TableHead>Created At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trades &&
                trades.length > 0 &&
                trades.map((trade) => (
                  <TableRow key={trade.id}>
                    <TableCell className="font-medium">
                      {trade.action}
                    </TableCell>
                    <TableCell className="font-medium">{trade.side}</TableCell>
                    <TableCell className="font-medium">
                      {trade.amountIn}
                    </TableCell>
                    <TableCell className="font-medium">
                      {trade.amountOut}
                    </TableCell>
                    <TableCell className="font-medium">
                      {new Intl.DateTimeFormat("en-US", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(trade.createdAt))}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="font-medium mb-2">Price History</h2>
          <div className="h-56 flex items-center justify-center text-gray-400">
            Line Graph
          </div>
        </div>
      </div>
    </div>
  );
}
