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
    // Matches shared/dtos/game:PlayerColor
    const actionToEnum = Sequelize.ENUM("alabaster", "onyx");
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
    return queryInterface.createTable("CyvasseGames", {
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
            tableName: "CyvasseVariants",
          },
          key: "variantId",
        },
      },
      action: {
        type: actionEnum,
        allowNull: false,
      },
      actionTo: {
        type: actionToEnum,
        allowNull: true,
      },
      alabasterUserId: userConfig,
      onyxUserId: userConfig,
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
    return queryInterface.dropTable("CyvasseGames");
  },
};
