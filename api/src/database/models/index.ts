import { User } from "./user";
import { Variant } from "./variant";
import { sequelize } from "./connection";
import { PieceRule } from "./piece_rule";
import { TerrainRule } from "./terrain_rule";
import { Game } from './game';

// Game
Game.belongsTo(Variant, { foreignKey: "variantId" });
Game.belongsTo(User, { foreignKey: "actionToUserId" });
Game.belongsTo(User, { foreignKey: "alabasterUserId" });
Game.belongsTo(User, { foreignKey: "onyxUserId" });

// PieceRule
PieceRule.belongsTo(Variant, { foreignKey: "variantId" });

// TerrainRule
TerrainRule.belongsTo(Variant, { foreignKey: "variantId" });

// User
User.hasMany(Variant, { foreignKey: "userId" });

// Variant
Variant.belongsTo(User, { foreignKey: "userId" });
Variant.hasMany(PieceRule, { foreignKey: "variantId" });

// Classes should be imported from so associations are setup properly
export { sequelize, Game, PieceRule, TerrainRule, User, Variant };
