import { User } from "./user";
import { Variant } from "./variant";
import { sequelize } from "./connection";
import { PieceRule } from "./piece_rule";

// PieceRule
PieceRule.belongsTo(Variant, { foreignKey: "variantId" });

// User
User.hasMany(Variant, { foreignKey: "userId" });

// Variant
Variant.belongsTo(User, { foreignKey: "userId" });
Variant.hasMany(PieceRule, { foreignKey: "variantId" });

// Classes should be imported from so associations are setup properly
export { sequelize, PieceRule, User, Variant };
