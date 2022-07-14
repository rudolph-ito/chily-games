"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Matches shared/dtos/yaniv/game:GameState
    const stateEnum = Sequelize.ENUM(
      "players_joining",
      "pickup",
      "meld_or_discard",
      "round_complete",
      "complete",
      "aborted",
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
    return queryInterface.createTable("RummyGames", {
      gameId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      hostUserId: userConfig,
      state: {
        type: stateEnum,
        allowNull: false,
      },
      options: {
        type: Sequelize.JSONB,
        allowNull: false,
      },
      actionToUserId: userConfig,
      players: {
        type: Sequelize.JSONB,
        allowNull: false,
      },
      cardsInDeck: {
        type: Sequelize.JSONB,
        allowNull: false,
      },
      discardState: {
        type: Sequelize.JSONB,
        allowNull: false,
      },
      melds: {
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
    return queryInterface.dropTable("RummyGames");
  },
};
