"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */

    await queryInterface.addColumn("Todos", "userId", {
      type: Sequelize.INTEGER,
    });

    await queryInterface.addConstraint("Todos", {
      type: "foreign key",
      fields: ["userId"],
      references: { table: "Users", field: "id" },
    });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */

    await queryInterface.removeColumn("Todos", "userId");
  },
};
