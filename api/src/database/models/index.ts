import { User } from "./user";
import { Variant } from "./variant";
import { sequelize } from "./connection";

// User
User.hasMany(Variant, { foreignKey: "userId" });

// Variant
Variant.belongsTo(User, { foreignKey: "userId" });
// has_many :games, dependent: :destroy
// has_many :piece_rules, dependent: :destroy
// has_many :terrain_rules, dependent: :destroy

// Classes should be imported from so associations are setup properly
export { sequelize, User, Variant };
