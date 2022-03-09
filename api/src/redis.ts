import { createClient } from "redis";

const sampleRedisClient = createClient({url: 'sample', legacyMode: true})

export type SimpleRedisClient = typeof sampleRedisClient;
