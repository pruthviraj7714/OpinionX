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
      const res = await axios.post(
        `${BACKEND_URL}/admin/markets`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${data?.accessToken}`,
          },
        }
      );

      toast.success(res.data?.message || "Market created successfully");
      router.push("/dashboard");
    } catch (err: any) {
      setServerError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Create Market</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block font-medium">Opinion</label>
          <input
            {...register("opinion")}
            className="w-full mt-1 p-2 border rounded"
          />
          {errors.opinion && (
            <p className="text-red-500 text-sm">
              {errors.opinion.message}
            </p>
          )}
        </div>

        <div>
          <label className="block font-medium">Description</label>
          <textarea
            {...register("description")}
            className="w-full mt-1 p-2 border rounded"
            rows={4}
          />
          {errors.description && (
            <p className="text-red-500 text-sm">
              {errors.description.message}
            </p>
          )}
        </div>

        <div>
          <label className="block font-medium">Expiry Time</label>
          <input
            type="datetime-local"
            {...register("expiryTime")}
            className="w-full mt-1 p-2 border rounded"
          />
          {errors.expiryTime && (
            <p className="text-red-500 text-sm">
              {errors.expiryTime.message}
            </p>
          )}
        </div>

        <div>
          <label className="block font-medium">Initial Liquidity</label>
          <input
            type="number"
            step="0.01"
            {...register("initialLiquidity")}
            className="w-full mt-1 p-2 border rounded"
          />
          {errors.initialLiquidity && (
            <p className="text-red-500 text-sm">
              {errors.initialLiquidity.message}
            </p>
          )}
        </div>

        <div>
          <label className="block font-medium">Fee Percent (optional)</label>
          <input
            type="number"
            step="0.01"
            {...register("feePercent")}
            className="w-full mt-1 p-2 border rounded"
          />
          {errors.feePercent && (
            <p className="text-red-500 text-sm">
              {errors.feePercent.message}
            </p>
          )}
        </div>

        {serverError && (
          <p className="text-red-600 font-medium">{serverError}</p>
        )}

        <button
          disabled={loading}
          className="bg-black text-white px-6 py-2 rounded disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Market"}
        </button>
      </form>
    </div>
  );
}
