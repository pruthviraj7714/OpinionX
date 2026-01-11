"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Activity } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ITrade } from "@/types/market";

interface TradesTableProps {
  displayedTrades: ITrade[];
  isLoading: boolean;
  isError?: Error | null;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  fetchNextPage?: () => void;
}

export function TradesTable({
  displayedTrades,
  isLoading,
  isError,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: TradesTableProps) {

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
      <div className="max-h-[420px] overflow-y-auto">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-zinc-900/95 backdrop-blur-sm border-b border-zinc-800">
            <TableRow className="hover:bg-transparent">
              {["Action", "Side", "Amount In", "Amount Out", "Time"].map((h) => (
                <TableHead
                  key={h}
                  className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 py-3"
                >
                  {h}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading &&
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i} className="border-zinc-800">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <TableCell key={j} className="py-3">
                      <div className="h-4 w-full rounded bg-zinc-800/60 animate-pulse" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {!isLoading && isError && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-12 text-center text-sm text-red-400"
                >
                  Failed to load trades
                </TableCell>
              </TableRow>
            )}

            {!isLoading &&
              !isError &&
              displayedTrades.length > 0 &&
              displayedTrades.map((trade) => (
                <TableRow
                  key={trade.id}
                  className="group border-zinc-800 text-sm transition-colors hover:bg-zinc-800/40"
                >
                  <TableCell className="py-3">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded text-[11px] font-semibold ${
                        trade.action === "BUY"
                          ? "bg-blue-500/20 text-blue-400"
                          : "bg-orange-500/20 text-orange-400"
                      }`}
                    >
                      {trade.action}
                    </span>
                  </TableCell>

                  <TableCell className="py-3 font-semibold">
                    <span
                      className={
                        trade.side === "YES"
                          ? "text-emerald-400"
                          : "text-red-400"
                      }
                    >
                      {trade.side}
                    </span>
                  </TableCell>

                  <TableCell className="py-3 font-mono text-zinc-100 tabular-nums">
                  {trade.action === "BUY" ? '$' : ""}
                    {Number(trade.amountIn).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                   {trade.action === "SELL" ? ' shares' : ""}

                  </TableCell>

                  <TableCell className="py-3 font-mono text-zinc-400 tabular-nums">
                  {trade.action === "SELL" ? '$' : ""}
                    {Number(trade.amountOut).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })} {trade.action === "BUY" ? 'shares' : ""}
                  </TableCell>

                  <TableCell
                    className="py-3 text-xs text-zinc-500 whitespace-nowrap"
                    title={new Date(trade.createdAt).toLocaleString()}
                  >
                    {formatDistanceToNow(new Date(trade.createdAt), {
                      addSuffix: true,
                    })}
                  </TableCell>
                </TableRow>
              ))}

            {!isLoading &&
              !isError &&
              displayedTrades.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-14 hover:bg-zinc-800/80 text-center">
                    <Activity className="mx-auto mb-3 h-10 w-10 text-zinc-700" />
                    <p className="text-sm font-medium text-zinc-400">
                      No trades yet
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      Trades will appear here as the market becomes active
                    </p>
                  </TableCell>
                </TableRow>
              )}
          </TableBody>
        </Table>
      </div>

      {hasNextPage && !isLoading && (
        <div className="border-t border-zinc-800 bg-zinc-900/40 py-3 text-center">
          <Button
            variant="ghost"
            size="sm"
            disabled={isFetchingNextPage}
            onClick={fetchNextPage}
            className="text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
          >
            {isFetchingNextPage ? "Loading…" : "Load more trades"}
          </Button>
        </div>
      )}
    </div>
  );
}