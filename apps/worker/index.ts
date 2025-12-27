import { Worker, Job } from "bullmq";
import { prisma } from "@repo/db";
import { redisclient } from "@repo/redisclient";

new Worker(
  "market-queue",
  async (job: Job) => {
    switch (job.name) {
      case "close-market-on-expiry": {
        const { marketId } = job.data;

        const market = await prisma.market.findUnique({
          where: {
            id: marketId,
          },
        });

        if (!market) {
          throw new Error("Market not found!");
        } else if (market.status === "CLOSED") {
          throw new Error("Market is alreday closed");
        } else if (market.status === "RESOLVED") {
          throw new Error("Market is alreday resolved");
        }

        await prisma.market.update({
          where: {
            id: marketId,
          },
          data: {
            status: "CLOSED",
          },
        });

        break;
      }
    }
  },
  {
    connection: redisclient,
  }
);
