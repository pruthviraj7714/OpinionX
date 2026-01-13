import Redis from "ioredis";

declare global {
  var redis: Redis | undefined;
}

const redis =
  global.redis ??
  new Redis({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
  });

if (!global.redis) {
    let logged = false;

    redis.on("connect", () => {
      if (!logged) {
        console.log("[Redis] Connected");
        logged = true;
      }
    });

  redis.on("error", (err) => {
    console.error("[Redis] Error", err);
  });

  global.redis = redis;
}

export default redis;
