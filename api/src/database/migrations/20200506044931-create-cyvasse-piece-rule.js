"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
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

    await queryInterface.createTable("CyvassePieceRules", {
      pieceRuleId: {
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
            tableName: "CyvasseVariants",
          },
          key: "variantId",
        },
      },
      pieceTypeId: {
        type: pieceTypeEnum,
        allowNull: false,
      },
      count: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      movementType: {
        type: Sequelize.ENUM(
          "orthogonal_line",
          "diagonal_line",
          "orthogonal_or_diagonal_line",
          "orthogonal_with_turns",
          "diagonal_with_turns"
        ),
        allowNull: false,
      },
      movementMinimum: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      movementMaximum: {
        type: Sequelize.INTEGER,
      },
      captureType: {
        type: Sequelize.ENUM("movement", "range"),
        allowNull: false,
      },
      rangeMinimum: {
        type: Sequelize.INTEGER,
      },
      rangeMaximum: {
        type: Sequelize.INTEGER,
      },
      rangeType: {
        type: Sequelize.ENUM(
          "orthogonal_line",
          "diagonal_line",
          "orthogonal_or_diagonal_line",
          "orthogonal_with_turns",
          "diagonal_with_turns"
        ),
      },
      moveAndRangeCapture: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
      },
      attackRank: {
        type: Sequelize.INTEGER,
      },
      defenseRank: {
        type: Sequelize.INTEGER,
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
    await queryInterface.addIndex(
      "CyvassePieceRules",
      ["variantId", "pieceTypeId"],
      {
        unique: true,
      }
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable("CyvassePieceRules");
  },
};
