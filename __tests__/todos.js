const request = require("supertest");

const db = require("../models/index");
const app = require("../app");
const cheerio = require("cheerio");

let server, agent;
const userA = {
  firstName: "John",
  lastName: "Doe",
  email: "john@example.com",
  password: "#4ks@#45rf",
};

const userB = {
  firstName: "William",
  lastName: "Butcher",
  email: "william@example.com",
  password: "#4krwer#45rf",
};

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

    res = await agent.post("/users").send({ ...userA, _csrf });

    expect(res.statusCode).toBe(302);

    res = await agent.get("/signup").send();
    _csrf = extractCsrfToken(res);

    res = await agent.post("/users").send({ ...userB, _csrf });

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
    await login(agent, userA.email, userA.password);

    const res = await agent.get("/todos").send();
    const _csrf = extractCsrfToken(res);

    const response = await agent.post("/todos").accept("json").send({
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf,
    });
    expect(response.statusCode).toBe(200);
  });

  test("Marks a todo with the given ID as complete", async () => {
    const agent = request.agent(server);
    await login(agent, userA.email, userA.password);

    let res = await agent.get("/todos").send();
    let _csrf = extractCsrfToken(res);

    const response = await agent.post("/todos").accept("json").send({
      title: "Buy more milk",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf,
    });

    res = await agent.get("/todos").send();
    _csrf = extractCsrfToken(res);

    const todoID = response.body.id;

    const markCompleteResponse = await agent
      .put(`/todos/${todoID}/`)
      .send({ _csrf, completed: true });

    expect(markCompleteResponse.body.completed).toBe(true);
  });

  test("Marks a todo with the given ID as incomplete", async () => {
    const agent = request.agent(server);
    await login(agent, userA.email, userA.password);

    let res = await agent.get("/todos").send();
    let _csrf = extractCsrfToken(res);

    const response = await agent.post("/todos").accept("json").send({
      title: "Get Compound V from Vaught",
      dueDate: new Date().toISOString(),
      completed: true,
      _csrf,
    });

    res = await agent.get("/todos").send();
    _csrf = extractCsrfToken(res);

    const todoID = response.body.id;

    const markCompleteResponse = await agent
      .put(`/todos/${todoID}/`)
      .send({ _csrf, completed: false });

    expect(markCompleteResponse.body.completed).toBe(false);
  });

  test("Deletes a todo with the given ID if it exists and sends a boolean response", async () => {
    const agent = request.agent(server);
    await login(agent, userA.email, userA.password);

    let res = await agent.get("/todos").send();
    let _csrf = extractCsrfToken(res);

    res = await agent.post("/todos").accept("json").send({
      title: "Eat chocolate",
      dueDate: new Date().toISOString(),
      _csrf,
    });

    const { id } = res.body;

    res = await agent.get("/todos").send();
    _csrf = extractCsrfToken(res);

    const res1 = await agent.delete(`/todos/${id}`).send({ _csrf });
    expect(res1.body.success).toBe(true);

    res = await agent.get("/todos").send();
    _csrf = extractCsrfToken(res);

    const res2 = await agent.delete("/todos/2856956").send({ _csrf });
    expect(res2.body.success).toBe(false);
  });

  test("One user can't delete other users todos", async () => {
    const agentA = request.agent(server);
    await login(agentA, userA.email, userA.password);
    // create todo as user A
    let resA = await agentA.get("/todos");
    let _csrfA = extractCsrfToken(resA);
    const createRes = await agentA.post("/todos").accept("json").send({
      title: "AAAAAAAAaa",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: _csrfA,
    });

    expect(createRes.statusCode).toBe(200);

    // try to delete todo as user B
    const agentB = request.agent(server);
    await login(agentB, userB.email, userB.password);

    let resB = await agentB.get("/todos");
    let _csrfB = extractCsrfToken(resB);

    const deleteRes = await agentB.delete(`/todos/${createRes.body.id}`).send({
      _csrf: _csrfB,
    });

    expect(deleteRes.body.success).toBe(false);
  });
});
