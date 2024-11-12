import { createClient } from "redis";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const sampleRedisClient = createClient({ url: "sample" });

export type SimpleRedisClient = typeof sampleRedisClient;
