"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Matches shared/dtos/terrain_rule.ts:PathRuleEffectType
    const pieceTypesEffectedEnum = Sequelize.ENUM(
      "all",
      "all_except",
      "none",
      "only"
    );
    // Matches shared/dtos/terrain_rule.ts:TerrainType
    const terrainTypeEnum = Sequelize.ENUM("forest", "mountain", "water");
    // Matches shared/dtos/piece_rule:PieceType
    const pieceTypeEnum = Sequelize.ENUM(
      "catapult",
      "crossbow",
      "dragon",
      "elephant",
      "heavy_horse",
      "king",
      "light_horse",
      "rabble",
      "spear",
      "trebuchet"
    );

    await queryInterface.createTable("TerrainRules", {
      terrainRuleId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      variantId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: {
            tableName: "Variants",
          },
          key: "variantId",
        },
      },
      terrainTypeId: {
        type: terrainTypeEnum,
        allowNull: false,
      },
      count: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      passableMovementFor: {
        type: pieceTypesEffectedEnum,
        allowNull: false,
      },
      passableMovementPieceTypeIds: {
        type: Sequelize.ARRAY(pieceTypeEnum),
        allowNull: false,
      },
      passableRangeFor: {
        type: pieceTypesEffectedEnum,
        allowNull: false,
      },
      passableRangePieceTypeIds: {
        type: Sequelize.ARRAY(pieceTypeEnum),
        allowNull: false,
      },
      slowsMovementBy: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      slowsMovementFor: {
        type: pieceTypesEffectedEnum,
        allowNull: false,
      },
      slowsMovementPieceTypeIds: {
        type: Sequelize.ARRAY(pieceTypeEnum),
        allowNull: false,
      },
      stopsMovementFor: {
        type: pieceTypesEffectedEnum,
        allowNull: false,
      },
      stopsMovementPieceTypeIds: {
        type: Sequelize.ARRAY(pieceTypeEnum),
        allowNull: false,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
    await queryInterface.addIndex("TerrainRules", ["variantId", "terrainTypeId"], { unique: true })
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable("TerrainRules");
  },
};
