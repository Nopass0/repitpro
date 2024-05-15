// redis.ts
import Redis from "ioredis";

const redisClient = new Redis({
  host: "redis", // замените на имя вашего контейнера Redis
  port: 6379,
});

redisClient.on("error", (err) => console.log("Redis Client Error", err));

(async () => {
  await redisClient.connect();
})();

export default redisClient;

export async function cacheData(key: string, value: any, expiration = 3600) {
  await redisClient.set(key, JSON.stringify(value), "EX", expiration);
}

export async function getCachedData(key: string) {
  const data = await redisClient.get(key);
  return data ? JSON.parse(data) : null;
}
