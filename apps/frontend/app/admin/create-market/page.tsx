"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { CreateMarketSchema } from "@repo/shared";
import { useState } from "react";
import axios from "axios";
import { BACKEND_URL } from "@/lib/config";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Clock,
  DollarSign,
  FileText,
  Loader2,
  Percent,
  Sparkles,
} from "lucide-react";

type FormData = z.infer<typeof CreateMarketSchema>;

export default function CreateMarketPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { data, status } = useSession();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(CreateMarketSchema),
  });

  const onSubmit = async (formData: FormData) => {
    if (status !== "authenticated") return;

    setLoading(true);
    setServerError(null);

    try {
      const res = await axios.post(`${BACKEND_URL}/admin/markets`, formData, {
        headers: {
          Authorization: `Bearer ${data?.accessToken}`,
        },
      });

      toast.success(res.data?.message || "Market created successfully");
      router.push("/dashboard");
    } catch (err: any) {
      setServerError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center gap-2 mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-linear-to-r from-purple-500 to-pink-500 rounded-lg blur-md opacity-50" />
              <div className="relative bg-linear-to-br from-purple-600 to-pink-600 p-3 rounded-lg">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-linear-to-r from-zinc-100 to-zinc-300 bg-clip-text text-transparent">
            Create New Market
          </h1>
          <p className="mt-2 text-zinc-400">
            Set up a prediction market for others to trade on
          </p>
        </div>

        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 shadow-xl shadow-zinc-950/50 overflow-hidden">
          <div className="p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
                  <FileText className="h-4 w-4 text-purple-400" />
                  Market Opinion
                </label>
                <input
                  {...register("opinion")}
                  placeholder="e.g., Will Bitcoin reach $100k by end of 2026?"
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder:text-zinc-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all outline-none"
                />
                {errors.opinion && (
                  <div className="flex items-center gap-2 text-red-400 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <p>{errors.opinion.message}</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
                  <FileText className="h-4 w-4 text-purple-400" />
                  Description
                </label>
                <textarea
                  {...register("description")}
                  placeholder="Provide detailed information about how this market will be resolved..."
                  rows={4}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder:text-zinc-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all outline-none resize-none"
                />
                {errors.description && (
                  <div className="flex items-center gap-2 text-red-400 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <p>{errors.description.message}</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
                  <Clock className="h-4 w-4 text-purple-400" />
                  Expiry Time
                </label>
                <div className="relative">
                  <input
                    type="datetime-local"
                    {...register("expiryTime")}
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all outline-none [color-scheme:dark]"
                  />
                </div>
                {errors.expiryTime && (
                  <div className="flex items-center gap-2 text-red-400 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <p>{errors.expiryTime.message}</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
                    <DollarSign className="h-4 w-4 text-purple-400" />
                    Initial Liquidity
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      {...register("initialLiquidity")}
                      placeholder="1000.00"
                      className="w-full pl-8 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder:text-zinc-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all outline-none"
                    />
                  </div>
                  {errors.initialLiquidity && (
                    <div className="flex items-center gap-2 text-red-400 text-sm">
                      <AlertCircle className="h-4 w-4" />
                      <p>{errors.initialLiquidity.message}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
                    <Percent className="h-4 w-4 text-purple-400" />
                    Fee Percent
                    <span className="text-xs text-zinc-500 font-normal">
                      (optional)
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      {...register("feePercent")}
                      placeholder="2.5"
                      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder:text-zinc-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all outline-none"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400">
                      %
                    </span>
                  </div>
                  {errors.feePercent && (
                    <div className="flex items-center gap-2 text-red-400 text-sm">
                      <AlertCircle className="h-4 w-4" />
                      <p>{errors.feePercent.message}</p>
                    </div>
                  )}
                </div>
              </div>

              {serverError && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4">
                  <div className="flex items-center gap-2 text-red-400">
                    <AlertCircle className="h-5 w-5" />
                    <p className="font-medium">{serverError}</p>
                  </div>
                </div>
              )}

              <div className="rounded-lg bg-purple-500/10 border border-purple-500/20 p-4">
                <div className="flex gap-3">
                  <div className="shrink-0">
                    <div className="h-8 w-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-purple-400" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-purple-300">
                      Market Creation Tips
                    </p>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Make sure your market question is clear and unambiguous.
                      The description should explain exactly how and when the
                      market will be resolved.
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-zinc-700 disabled:to-zinc-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg shadow-purple-600/20 hover:shadow-purple-600/30 disabled:shadow-none flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Creating Market...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    <span>Create Market</span>
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="h-1 bg-linear-to-r from-purple-600 via-pink-600 to-purple-600" />
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-zinc-500">
            Need help?{" "}
            <a
              href="/help"
              className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
            >
              Check our guide
            </a>{" "}
            on creating effective markets
          </p>
        </div>
      </div>
    </div>
  );
}
