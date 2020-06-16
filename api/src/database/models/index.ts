import { User } from "./user";
import { Variant } from "./variant";
import { sequelize } from "./connection";
import { PieceRule } from "./piece_rule";
import { TerrainRule } from "./terrain_rule";
import { Game } from "./game";
import { Challenge } from "./challenge";

// Challenge
Challenge.belongsTo(Variant, {
  foreignKey: { name: "variantId", allowNull: false },
});
Challenge.belongsTo(User, {
  foreignKey: { name: "creatorUserId", allowNull: false },
});
Challenge.belongsTo(User, {
  foreignKey: { name: "opponentUserId", allowNull: true },
});

// Game
Game.belongsTo(Variant, {
  foreignKey: { name: "variantId", allowNull: false },
});
Game.belongsTo(User, {
  foreignKey: { name: "actionToUserId", allowNull: true },
});
Game.belongsTo(User, {
  foreignKey: { name: "alabasterUserId", allowNull: false },
});
Game.belongsTo(User, { foreignKey: { name: "onyxUserId", allowNull: false } });

// PieceRule
PieceRule.belongsTo(Variant, {
  foreignKey: { name: "variantId", allowNull: false },
});

// TerrainRule
TerrainRule.belongsTo(Variant, {
  foreignKey: { name: "variantId", allowNull: false },
});

// Variant
Variant.belongsTo(User, { foreignKey: { name: "userId", allowNull: false } });

// Classes should be imported from so associations are setup properly
export { sequelize, Challenge, Game, PieceRule, TerrainRule, User, Variant };
