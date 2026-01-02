import AdminMarketPageComponent from "@/components/AdminMarketPageComponent";
import MarketPageComponent from "@/components/MarketPageComponent";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function MarketPage({
  params,
}: {
  params: Promise<{
    marketId: string;
  }>;
}) {
  const marketId = (await params).marketId;
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/");
  }

  if (session.user.role === "ADMIN") {
    return <AdminMarketPageComponent marketId={marketId} />;
  }

  return <MarketPageComponent marketId={marketId} />;
}
