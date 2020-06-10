'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    // Matches shared/dtos/game:PlayAs
    const playAsEnum = Sequelize.ENUM(
      "alabaster",
      "onyx",
      "random"
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
      creatorUserId: userConfig,
      opponentUserId: userConfig,
      playAs: {
        type: playAsEnum,
        allowNull: false
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
  }
};
