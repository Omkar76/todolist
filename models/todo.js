"use strict";
const { Model, Op } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Todo extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Todo.belongsTo(models.User, {
        foreignKey: "userId",
      });
      // define association here
    }
    static getTodos() {
      return this.findAll();
    }

    static async addTodo({ title, dueDate, completed, userId }) {
      return await this.create({
        title: title,
        dueDate: dueDate,
        completed: completed || false,
        userId,
      });
    }

    markAsCompleted() {
      return this.update({ completed: true });
    }

    setCompletionStatus(completed) {
      return this.update({ completed });
    }

    static async remove(id, userId) {
      return this.destroy({
        where: {
          id,
          userId,
        },
      });
    }

    static async overdue(userId) {
      return this.findAll({
        where: {
          completed: false,
          dueDate: {
            [Op.lt]: new Date(),
          },
          userId,
        },
      });
    }

    static async dueLater(userId) {
      return this.findAll({
        where: {
          dueDate: {
            [Op.gt]: new Date(),
          },
          completed: false,
          userId,
        },
      });
    }

    static async dueToday(userId) {
      return this.findAll({
        where: {
          completed: false,
          dueDate: {
            [Op.eq]: new Date(),
          },
          userId,
        },
      });
    }

    static async completed(userId) {
      return this.findAll({
        where: {
          completed: true,
          userId,
        },
      });
    }
  }

  Todo.init(
    {
      title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: true,
          notEmpty: { msg: "Title must not be empty" },
          len: { args: 5, msg: "Title must be 5 or more charecters" },
        },
      },
      dueDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
          notNull: { msg: "due date is required" },
          notEmpty: { msg: "due date is required" },
        },
      },
      completed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      sequelize,
      modelName: "Todo",
    }
  );
  return Todo;
};
