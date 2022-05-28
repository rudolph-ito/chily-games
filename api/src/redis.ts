import { createClient } from "redis";

const sampleRedisClient = createClient({ url: "sample" });

export type SimpleRedisClient = typeof sampleRedisClient;
