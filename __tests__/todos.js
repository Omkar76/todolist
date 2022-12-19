const request = require("supertest");

const db = require("../models/index");
const app = require("../app");
const cheerio = require("cheerio");

let server, agent;
const firstName = "John",
  lastName = "Doe",
  email = "john@example.com",
  password = "#4ks@#45rf";

function extractCsrfToken(response) {
  const $ = cheerio.load(response.text);
  return $('[name="_csrf"]').val();
}

async function login(agent, email, password) {
  let res = await agent.get("/login");
  let _csrf = extractCsrfToken(res);

  await agent.post("/login").send({
    email,
    password,
    _csrf,
  });
}

describe("Todo Application", function () {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(4000, () => {});
    agent = request.agent(server);
  });

  afterAll(async () => {
    await db.sequelize.close();
    await server.close();
  });

  test("Sign up", async () => {
    let res = await agent.get("/signup").send();
    let _csrf = extractCsrfToken(res);

    res = await agent.post("/users").send({
      firstName,
      lastName,
      email,
      password,
      _csrf,
    });

    expect(res.statusCode).toBe(302);
  });

  test("Sign out", async () => {
    let res = await agent.get("/todos");
    expect(res.statusCode).toBe(200);

    res = await agent.get("/signout");
    expect(res.statusCode).toBe(302);

    res = await agent.get("/todos");
    expect(res.statusCode).toBe(302);
  });

  test("Creates a todo", async () => {
    const agent = request.agent(server);
    await login(agent, email, password);

    const res = await agent.get("/todos").send();
    const _csrf = extractCsrfToken(res);

    const response = await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf,
    });
    expect(response.statusCode).toBe(200);
  });

  test("New todo has completed:false", async () => {
    const agent = request.agent(server);
    await login(agent, email, password);

    const res = await agent.get("/todos").send();
    const _csrf = extractCsrfToken(res);

    const response = await agent.post("/todos").send({
      title: "Build a nether portal",
      dueDate: new Date().toISOString(),
      _csrf,
    });

    expect(response.body.completed).toBe(false);
  });

  test("Marks a todo with the given ID as complete", async () => {
    const agent = request.agent(server);
    await login(agent, email, password);

    let res = await agent.get("/todos").send();
    let _csrf = extractCsrfToken(res);

    const response = await agent.post("/todos").send({
      title: "Buy more milk",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf,
    });

    res = await agent.get("/todos").send();
    _csrf = extractCsrfToken(res);

    const parsedResponse = JSON.parse(response.text);
    const todoID = parsedResponse.id;

    const markCompleteResponse = await agent
      .put(`/todos/${todoID}/`)
      .send({ _csrf, completed: true });

    const parsedUpdateResponse = JSON.parse(markCompleteResponse.text);
    expect(parsedUpdateResponse.completed).toBe(true);
  });

  test("Marks a todo with the given ID as incomplete", async () => {
    const agent = request.agent(server);
    await login(agent, email, password);

    let res = await agent.get("/todos").send();
    let _csrf = extractCsrfToken(res);

    const response = await agent.post("/todos").send({
      title: "Get Compound V from Vaught",
      dueDate: new Date().toISOString(),
      completed: true,
      _csrf,
    });

    res = await agent.get("/todos").send();
    _csrf = extractCsrfToken(res);

    const parsedResponse = JSON.parse(response.text);
    const todoID = parsedResponse.id;

    const markCompleteResponse = await agent
      .put(`/todos/${todoID}/`)
      .send({ _csrf, completed: false });

    const parsedUpdateResponse = JSON.parse(markCompleteResponse.text);

    expect(parsedUpdateResponse.completed).toBe(false);
  });

  test("Deletes a todo with the given ID if it exists and sends a boolean response", async () => {
    const agent = request.agent(server);
    await login(agent, email, password);

    let res = await agent.get("/todos").send();
    let _csrf = extractCsrfToken(res);

    res = await agent.post("/todos").send({
      title: "Eat chocolate",
      dueDate: new Date().toISOString(),
      _csrf,
    });

    const { id } = res.body;

    res = await agent.get("/todos").send();
    _csrf = extractCsrfToken(res);

    const res1 = await agent.delete(`/todos/${id}`).send({ _csrf });
    expect(res1.body).toBe(true);

    res = await agent.get("/todos").send();
    _csrf = extractCsrfToken(res);

    const res2 = await agent.delete("/todos/2856956").send({ _csrf });
    expect(res2.body).toBe(false);
  });
});
