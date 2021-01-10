"use strict";
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable("Users", {
      userId: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      username: {
        allowNull: false,
        type: Sequelize.STRING,
        unique: true,
      },
      passwordSalt: {
        allowNull: false,
        type: Sequelize.STRING(256),
      },
      passwordHash: {
        allowNull: false,
        type: Sequelize.STRING(512),
      },
      displayName: {
        allowNull: false,
        type: Sequelize.STRING,
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
    return queryInterface.dropTable("Users");
  },
};
