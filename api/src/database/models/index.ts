import { User } from "./user";
import { CyvasseVariant } from "./cyvasse_variant";
import { sequelize } from "./connection";
import { CyvassePieceRule } from "./cyvasse_piece_rule";
import { CyvasseTerrainRule } from "./cyvasse_terrain_rule";
import { CyvasseGame } from "./cyvasse_game";
import { CyvasseChallenge } from "./cyvasse_challenge";
import { YanivGame } from "./yaniv_game";
import { YanivGamePlayer } from "./yaniv_game_player";
import { YanivGameCompletedRound } from "./yaniv_game_completed_round";

// Cyvasse Challenge
CyvasseChallenge.belongsTo(CyvasseVariant, {
  foreignKey: { name: "variantId", allowNull: false },
});
CyvasseChallenge.belongsTo(User, {
  foreignKey: { name: "creatorUserId", allowNull: false },
});
CyvasseChallenge.belongsTo(User, {
  foreignKey: { name: "opponentUserId", allowNull: true },
});

// Cyvasse Game
CyvasseGame.belongsTo(CyvasseVariant, {
  foreignKey: { name: "variantId", allowNull: false },
});
CyvasseGame.belongsTo(User, {
  foreignKey: { name: "alabasterUserId", allowNull: false },
});
CyvasseGame.belongsTo(User, {
  foreignKey: { name: "onyxUserId", allowNull: false },
});

// Cyvasse PieceRule
CyvassePieceRule.belongsTo(CyvasseVariant, {
  foreignKey: { name: "variantId", allowNull: false },
});

// Cyvasse TerrainRule
CyvasseTerrainRule.belongsTo(CyvasseVariant, {
  foreignKey: { name: "variantId", allowNull: false },
});

// Cyvasse Variant
CyvasseVariant.belongsTo(User, {
  foreignKey: { name: "userId", allowNull: false },
});

// Yaniv Game
YanivGame.belongsTo(User, {
  foreignKey: { name: "hostUserId", allowNull: false },
});
YanivGame.belongsTo(User, {
  foreignKey: { name: "actionToUserId", allowNull: true },
});

YanivGamePlayer.belongsTo(YanivGame, {
  foreignKey: { name: "gameId", allowNull: false },
});
YanivGamePlayer.belongsTo(User, {
  foreignKey: { name: "userId", allowNull: false },
});

YanivGameCompletedRound.belongsTo(YanivGame, {
  foreignKey: { name: "gameId", allowNull: false },
});
YanivGameCompletedRound.belongsTo(User, {
  foreignKey: { name: "userId", allowNull: false },
});

// Classes should be imported from so associations are setup properly
export {
  sequelize,
  User,
  CyvasseChallenge,
  CyvasseGame,
  CyvassePieceRule,
  CyvasseTerrainRule,
  CyvasseVariant,
  YanivGame,
  YanivGamePlayer,
  YanivGameCompletedRound,
};
