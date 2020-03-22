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
        type: Sequelize.ENUM("none", "binary", "sum"),
        allowNull: false
      }
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable("Variants");
  }
};
