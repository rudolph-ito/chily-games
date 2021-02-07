import { IOhHeckPlayer } from "../../database/models/oh_heck_game";

export function validateBet(players: IOhHeckPlayer[], bet: number): null | string {
  const numberOfCardsInRound = players[0].cardsInHand.length;
  if (bet < 0 || bet > numberOfCardsInRound) {
    return `Bet must be between 0 and ${numberOfCardsInRound}.`;
  }
  const playersWithBets = players.filter(x => x.bet !== null);
  if (playersWithBets.length == players.length - 1) {
    const otherBetsSum = playersWithBets.reduce((sum, player) => sum + (player.bet ?? 0), 0)
    if (otherBetsSum + bet == numberOfCardsInRound) {
      return `Bet cannot be ${bet} as sum of bets cannot be ${numberOfCardsInRound}.`
    }
  }
  return null
}