"use strict";

module.exports = {
  up: (queryInterface, Sequelize) => {
    // Matches shared/dtos/cyvasse/game:PlayAs
    const playAsEnum = Sequelize.ENUM("alabaster", "onyx", "random");
    return queryInterface.createTable("Challenges", {
      challengeId: {
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
      creatorUserId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: {
            tableName: "Users",
          },
          key: "userId",
        },
      },
      opponentUserId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: {
            tableName: "Users",
          },
          key: "userId",
        },
      },
      creatorPlayAs: {
        type: playAsEnum,
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
    return queryInterface.dropTable("Challenges");
  },
};
