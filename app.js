const express = require("express");
const app = express();
const { Todo } = require("./models");
const path = require("path");
const cookieParser = require("cookie-parser");
const csrf = require("tiny-csrf");

app.use(cookieParser("kfdsjkgfdsjfjhfjdsfjdfhgsdjgjfsdhjfgdsfh"));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(csrf("hwgA0JweSTaQFclN08fFvJOEIFCaxdSs", ["POST", "PUT", "DELETE"]));
app.use(express.static(path.join(__dirname, "public")));

app.set("view engine", "ejs");

app.get("/", async function (request, response) {
  const [overdue, dueToday, dueLater, completed] = await Promise.all([
    Todo.overdue(),
    Todo.dueToday(),
    Todo.dueLater(),
    Todo.completed(),
  ]);
  if (request.accepts("html")) {
    return response.render("index", {
      overdue,
      dueToday,
      dueLater,
      completed,
      csrfToken: request.csrfToken(),
    });
  } else {
    return response.json({ overdue, dueToday, dueLater, completed });
  }
});

app.get("/todos", async function (_request, response) {
  console.log("Processing list of all Todos ...");
  try {
    const todos = await Todo.findAll();
    return response.json(todos);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.get("/todos/:id", async function (request, response) {
  try {
    const todo = await Todo.findByPk(request.params.id);
    return response.json(todo);
  } catch (error) {
    console.log(error);
    return response.status(404).json(error);
  }
});

app.post("/todos", async function (request, response) {
  try {
    const todo = await Todo.addTodo(request.body);
    return response.json(todo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.put("/todos/:id/", async function (request, response) {
  const todo = await Todo.findByPk(request.params.id);
  try {
    console.log(request.body.completed + "bonkai");
    const updatedTodo = await todo.setCompletionStatus(request.body.completed);
    console.log(updatedTodo);
    return response.json(updatedTodo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.delete("/todos/:id", async function (request, response) {
  console.log("We have to delete a Todo with ID: ", request.params.id);
  // First, we have to query our database to delete a Todo by ID.
  let rowCount = 0;
  try {
    rowCount = await Todo.destroy({ where: { id: request.params.id } });
    response.send(rowCount != 0);
    return;
  } catch (error) {
    console.log(error);
    response.status(422).json(false);
    return;
  }
  // // Then, we have to respond back with true/false based on whether the Todo was deleted or not.
  // response.send(true)
});

module.exports = app;
