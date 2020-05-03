"use strict";

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable("Variants", {
      variantId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
      },
      boardType: {
        type: Sequelize.ENUM("square", "hexagonal"),
        allowNull: false
      },
      boardRows: {
        type: Sequelize.INTEGER
      },
      boardColumns: {
        type: Sequelize.INTEGER
      },
      boardSize: {
        type: Sequelize.INTEGER
      },
      pieceRanks: {
        type: Sequelize.BOOLEAN,
        allowNull: false
      },
      supportType: {
        type: Sequelize.ENUM("none", "binary", "sum")
      },
      userId: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: {
            tableName: "Users"
          },
          key: "userId"
        }
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable("Variants");
  }
};
