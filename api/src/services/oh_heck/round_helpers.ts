export function getNumberOfCardsToDeal(roundNumber: number) {
  if (roundNumber < 1 || roundNumber > 14) {
    throw new Error(`Unexpected round number: ${roundNumber}`)
  }
  if (roundNumber <= 7) {
    return 8 - roundNumber;
  }
  return roundNumber - 7;
}