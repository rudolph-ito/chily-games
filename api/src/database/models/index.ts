import { PieceType } from "./piece_type";
import { User } from "./user";
import { Variant } from "./variant";

// User
User.hasMany(Variant);
// has_many :comments
// has_many :ratings
// has_many :topics
// has_many :variants

// Variant
Variant.belongsTo(User);
// has_many :games, dependent: :destroy
// has_many :piece_rules, dependent: :destroy
// has_many :terrain_rules, dependent: :destroy
// has_many :ratings, dependent: :destroy
// has_many :topics, as: :parent, dependent: :destroy

// Classes should be imported from so associations are setup properly
export { PieceType, User, Variant };
