"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Matches shared/dtos/yaniv/game:RoundScoreType
    const roundScoreTypeEnum = Sequelize.ENUM("default", "yaniv", "asaf");
    queryInterface.createTable("YanivGameCompletedRounds", {
      gameId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: {
          model: {
            tableName: "YanivGames",
          },
          key: "gameId",
        },
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: {
          model: {
            tableName: "Users",
          },
          key: "userId",
        },
      },
      roundNumber: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      score: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      scoreType: {
        type: roundScoreTypeEnum,
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
    return queryInterface.dropTable("YanivGameCompletedRounds");
  },
};
