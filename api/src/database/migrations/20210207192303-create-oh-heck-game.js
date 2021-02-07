"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Matches shared/dtos/oh_heck/game:GameState
    const stateEnum = Sequelize.ENUM(
      "players_joining",
      "betting",
      "trick_active",
      "trick_complete",
      "round_complete",
      "complete",
      "aborted"
    );
    const userConfig = {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: {
          tableName: "Users",
        },
        key: "userId",
      },
    };
    return queryInterface.createTable("OhHeckGames", {
      gameId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      hostUserId: userConfig,
      options: {
        type: Sequelize.JSONB,
        allowNull: false,
      },
      state: {
        type: stateEnum,
        allowNull: false,
      },
      actionToUserId: userConfig,
      players: {
        type: Sequelize.JSONB,
        allowNull: false,
      },
      currentTrick: {
        type: Sequelize.JSONB,
        allowNull: false,
      },
      completedRounds: {
        type: Sequelize.JSONB,
        allowNull: false,
      },
      version: {
        type: Sequelize.INTEGER,
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

  down: async (queryInterface, Sequelize) => {
    return queryInterface.dropTable("OhHeckGames");
  },
};
