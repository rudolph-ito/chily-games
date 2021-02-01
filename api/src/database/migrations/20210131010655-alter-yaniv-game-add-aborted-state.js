"use strict";

const replaceEnum = require("sequelize-replace-enum-postgres").default;

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return replaceEnum({
      queryInterface,
      tableName: "YanivGames",
      columnName: "state",
      newValues: [
        "players_joining",
        "round_active",
        "round_complete",
        "complete",
        "aborted",
      ],
      enumName: "enum_YanivGames_state",
    });
  },

  down: async (queryInterface, Sequelize) => {
    return replaceEnum({
      queryInterface,
      tableName: "YanivGames",
      columnName: "state",
      newValues: [
        "players_joining",
        "round_active",
        "round_complete",
        "complete",
      ],
      enumName: "enum_YanivGames_state",
    });
  },
};
