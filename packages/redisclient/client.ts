import Redis from "ioredis";


const redis = new Redis({
    host : process.env.REDIS_HOST,
    port : Number(process.env.REDIS_PORT),
    password : process.env.REDIS_PASSWORD,
    maxRetriesPerRequest : null,
    enableReadyCheck : true
})

redis.on('connect', () => {
    console.log('[Redis] Connected');
})

redis.on('error', (err) => {
    console.error("[Redis] error", err)
})

export default redis;