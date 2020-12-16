"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const cardsConfig = {
      type: Sequelize.ARRAY(Sequelize.INTEGER),
      allowNull: false,
    };
    return queryInterface.createTable("YanivGamePlayers", {
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
      position: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      cardsInHand: cardsConfig,
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
    return queryInterface.dropTable("YanivGamePlayers");
  },
};
