'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.createTable("Chats", {
      chatId: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true,
      },
      chatMessages: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      version: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.dropTable("Chats");
  }
};
