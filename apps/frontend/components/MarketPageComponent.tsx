"use client";
import { BACKEND_URL } from "@/lib/config";
import axios from "axios";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";


interface IMarket {
    opinion : string;
    description : string;
    expiryTime : string;
    yesPool : string;
    noPool : string;
    adminId : string;
}


export default function MarketPageComponent({
  marketId,
}: {
  marketId: string;
}) {
  const { data, status } = useSession();
  const [marketData, setMarketData] = useState<IMarket | null>(null);

  const fetchMarketInfo = async () => {
    try {
      const res = await axios.get<IMarket>(`${BACKEND_URL}/markets/${marketId}`, {
        headers: {
          Authorization: `Bearer ${data?.accessToken}`,
        },
      });

      setMarketData(res.data);
    } catch (error: any) {
      toast.error(error?.response?.data.message || error?.message);
    }
  };

  useEffect(() => {
    if (marketId && status === "authenticated") {
      fetchMarketInfo();
    }
  }, [marketId, status]);

  return <div className="min-h-screen">

        <div>
            Question: 
            {marketData?.opinion}
        </div>
        <div>
            description {marketData?.description}
        </div>


  </div>;
}
