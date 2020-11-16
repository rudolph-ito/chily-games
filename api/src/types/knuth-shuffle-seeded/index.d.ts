declare module 'knuth-shuffle-seeded' {
  export default function shuffle<T>(inputArray: T[], seed?: number): void
}