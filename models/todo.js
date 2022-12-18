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

    static async addTodo({ title, dueDate }) {
      return await this.create({
        title: title,
        dueDate: dueDate,
        completed: false,
      });
    }

    markAsCompleted() {
      return this.update({ completed: true });
    }

    setCompletionStatus(completed) {
      return this.update({ completed });
    }

    static async overdue() {
      return this.findAll({
        where: {
          completed: false,
          dueDate: {
            [Op.lt]: new Date(),
          },
        },
      });
    }

    static async dueLater() {
      return this.findAll({
        where: {
          dueDate: {
            [Op.gt]: new Date(),
          },
          completed: false,
        },
      });
    }

    static async dueToday() {
      return this.findAll({
        where: {
          completed: false,
          dueDate: {
            [Op.eq]: new Date(),
          },
        },
      });
    }

    static async completed() {
      return this.findAll({
        where: {
          completed: true,
        },
      });
    }
  }

  Todo.init(
    {
      title: DataTypes.STRING,
      dueDate: DataTypes.DATEONLY,
      completed: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "Todo",
    }
  );
  return Todo;
};
