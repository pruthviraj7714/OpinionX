import MarketPageComponent from "@/components/MarketPageComponent";

export default async function MarketPage({params} : {
    params : Promise<{
        marketId : string
    }>
}) {
    const marketId = (await params).marketId;

    return <MarketPageComponent marketId={marketId} />

}