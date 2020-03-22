"use strict";

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable("PieceTypes", {
      name: {
        allowNull: false,
        type: Sequelize.STRING,
        primaryKey: true
      },
      alabasterImageUrl: {
        type: Sequelize.STRING,
        allowNull: false
      },
      onyxImageUrl: {
        type: Sequelize.STRING,
        allowNull: false
      }
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable("PieceTypes");
  }
};
