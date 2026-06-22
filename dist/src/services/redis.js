import Redis from "ioredis";
// Debugging line: This will show you exactly what Node sees on startup
console.log("Redis Debug Info:", {
    URL_EXISTS: !!process.env.REDIS_URL,
    HOST: process.env.REDIS_HOST,
    HAS_PASSWORD: !!process.env.REDIS_PASSWORD,
});
let redis;
// If a full connection URL exists (like redis://user:password@host:port), use it directly
if (process.env.REDIS_URL) {
    redis = new Redis(process.env.REDIS_URL);
}
else {
    // Otherwise, fall back to individual fields
    redis = new Redis({
        host: process.env.REDIS_HOST || "127.0.0.1",
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
    });
}
redis.on("connect", () => {
    console.log("Redis connected successfully");
});
redis.on("error", (err) => {
    console.error("Redis connection error:", err);
});
export default redis;
