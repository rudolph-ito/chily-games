"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Matches shared/dtos/rummikub/game:GameState
    const stateEnum = Sequelize.ENUM(
      "players_joining",
      "round_active",
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
    return queryInterface.createTable("RummikubGames", {
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
      sets: {
        type: Sequelize.JSONB,
        allowNull: false,
      },
      tilePool: {
        type: Sequelize.JSONB,
        allowNull: false,
      },
      players: {
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
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.dropTable("RummikubGames");
  },
};
