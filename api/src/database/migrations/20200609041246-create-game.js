"use strict";

module.exports = {
  up: (queryInterface, Sequelize) => {
    // Matches shared/dtos/game:Action
    const actionEnum = Sequelize.ENUM(
      "setup",
      "play",
      "complete",
      "aborted",
      "resigned"
    );
    const userConfig = (allowNull) => {
      return {
        type: Sequelize.INTEGER,
        allowNull,
        references: {
          model: {
            tableName: "Users",
          },
          key: "userId",
        },
      };
    };
    return queryInterface.createTable("Games", {
      gameId: {
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
      action: {
        type: actionEnum,
        allowNull: false,
      },
      actionToUserId: userConfig(true),
      alabasterUserId: userConfig(false),
      onyxUserId: userConfig(false),
      alabasterSetupCoordinateMap: {
        type: Sequelize.JSONB,
        allowNull: false,
      },
      onyxSetupCoordinateMap: {
        type: Sequelize.JSONB,
        allowNull: false,
      },
      currentCoordinateMap: {
        type: Sequelize.JSONB,
        allowNull: false,
      },
      plies: {
        type: Sequelize.JSONB,
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
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable("Games");
  },
};
