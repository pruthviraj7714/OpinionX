import { EligibilityResponse, ParticipationResponse } from "@/types/market";
import { api } from "./axios";

export const getMarketInfo = async (marketId: string, token?: string) => {
  const { data } = await api.get(`/markets/${marketId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return data;
};

export const getMarketTrades = async (
  marketId: string,
  cursor?: string,
  token?: string
) => {
  const { data } = await api.get(
    `/markets/${marketId}/trades?limit=10&cursor=${cursor}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return data;
};

export const getProbabilityChartData = async (
  marketId: string,
  chartInterval: string,
  token?: string
) => {
  const { data } = await api.get(
    `/markets/${marketId}/charts/probability?interval=${chartInterval}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return data.points;
};

export const getParticipationChartData = async (
  marketId: string,
  token?: string
): Promise<ParticipationResponse> => {
  const { data } = await api.get(`/markets/${marketId}/charts/participation`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return data;
};

export const checkPayoutEligibility = async (
  marketId: string,
  token?: string
): Promise<EligibilityResponse> => {
  const { data } = await api.get(`/markets/${marketId}/eligibility`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return data;
};
