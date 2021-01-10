"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Matches shared/dtos/yaniv/game:GameState
    const stateEnum = Sequelize.ENUM(
      "players_joining",
      "round_active",
      "round_complete",
      "complete"
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
    const cardsConfig = {
      type: Sequelize.ARRAY(Sequelize.INTEGER),
      allowNull: false,
    };
    return queryInterface.createTable("YanivGames", {
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
      cardsInDeck: cardsConfig,
      cardsOnTopOfDiscardPile: cardsConfig,
      cardsBuriedInDiscardPile: cardsConfig,
      players: {
        type: Sequelize.JSONB,
        allowNull: false
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
    return queryInterface.dropTable("YanivGames");
  },
};
