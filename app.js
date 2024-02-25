const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser");
const csrf = require("tiny-csrf");
const express = require("express");
const flash = require("connect-flash");
const LocalStratergy = require("passport-local");
const passport = require("passport");
const path = require("path");
const session = require("express-session");
const ensureLogin = require("connect-ensure-login");
// const FileStore = require("session-file-store")(session);
const { Todo, User } = require("./models");
const { ValidationError } = require("sequelize");

const app = express();
const saltRounds = 10;
app.use(cookieParser("kfdsjkgfdsjfjhfjdsfjdfhgsdjgjfsdhjfgdsfh"));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(csrf("hwgA0JweSTaQFclN08fFvJOEIFCaxdSs", ["POST", "PUT", "DELETE"]));
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    // store: new FileStore({ path: "sessions" }),
    resave: false,
    saveUninitialized: false,
    secret: "B8/tsjAyWkJr)+esh:a.SSW..o.ZM?",
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hrs
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
passport.use(
  new LocalStratergy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    async (email, password, done) => {
      console.log(password);
      try {
        const user = await User.findOne({ where: { email } });

        // if there is no user with the given username, return a message
        if (!user) {
          return done(null, false, { message: "User doesn't exist" });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        // if passwords don't match return message

        if (!isMatch) {
          return done(null, false, { message: "Invalid password" });
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  console.log(user);
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
  // User.findByPk(id)
  // .then(user=>{
  //   done(null, user);
  // }).catch(error=>{
  //   done(error, null)
  // })
});
app.set("view engine", "ejs");

app.get("/", async function (request, response) {
  if (request.isAuthenticated()) {
    response.redirect("/todos/");
  } else {
    response.render("index");
  }
});

app.get("/signup", function (request, response) {
  response.locals.errors = request.flash("error");

  response.render("signup", {
    title: "Sign up",
    csrfToken: request.csrfToken(),
  });
});

app.get("/login", function (request, response) {
  response.locals.errors = request.flash("error");
  response.render("login", { title: "Login", csrfToken: request.csrfToken() });
});

app.get("/signout", function (request, response) {
  request.logout((err) => {
    if (err) {
      console.log(err);
    } else {
      response.redirect("/");
    }
  });
});

app.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  function (request, response) {
    response.redirect("/todos");
  }
);

app.post("/users", async function (request, response) {
  let user;
  try {
    const hashedPassword = await bcrypt.hash(request.body.password, saltRounds);
    user = await User.create({ ...request.body, password: hashedPassword });
  } catch (error) {
    if (error instanceof ValidationError) {
      request.flash(
        "error",
        error.errors.map((err) => err.message)
      );
      return response.redirect("/signup");
    }
  }

  request.login(user, (err) => {
    if (err) {
      return console.log(err);
    }
    response.redirect("/login");
  });
});

app.get(
  "/todos",
  ensureLogin.ensureLoggedIn({ redirectTo: "/login" }),
  async function (request, response) {
    const { id } = request.user;
    const [overdue, dueToday, dueLater, completed] = await Promise.all([
      Todo.overdue(id),
      Todo.dueToday(id),
      Todo.dueLater(id),
      Todo.completed(id),
    ]);
    if (request.accepts("html")) {
      response.locals.errors = request.flash("error");

      return response.render("todos", {
        overdue,
        dueToday,
        dueLater,
        completed,
        csrfToken: request.csrfToken(),
        username: request.user.firstName + " " + request.user.lastName,
      });
    } else {
      return response.json({ overdue, dueToday, dueLater, completed });
    }
  }
);

app.get(
  "/todos/:id",
  ensureLogin.ensureLoggedIn({ redirectTo: "/login" }),
  async function (request, response) {
    try {
      const todo = await Todo.findByPk(request.params.id);
      return response.json(todo);
    } catch (error) {
      return response.status(404).json(error);
    }
  }
);

app.post(
  "/todos",
  ensureLogin.ensureLoggedIn({ redirectTo: "/login" }),
  async function (request, response) {
    try {
      const todo = await Todo.addTodo({
        ...request.body,
        userId: request.user.id,
      });

      if (request.accepts("html")) {
        return response.redirect("/todos");
      } else {
        return response.json(todo);
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        request.flash(
          "error",
          error.errors.map((err) => err.message)
        ); // horrible
      }
      return response.redirect("/todos");
    }
  }
);

app.put(
  "/todos/:id/",
  ensureLogin.ensureLoggedIn({ redirectTo: "/login" }),
  async function (request, response) {
    const todo = await Todo.findByPk(request.params.id);
    try {
      const updatedTodo = await todo.setCompletionStatus(
        request.body.completed
      );
      return response.json(updatedTodo);
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

app.delete(
  "/todos/:id",
  ensureLogin.ensureLoggedIn({ redirectTo: "/login" }),
  async function (request, response) {
    console.log("We have to delete a Todo with ID: ", request.params.id);
    // First, we have to query our database to delete a Todo by ID.
    let rowCount = 0;
    try {
      rowCount = await Todo.remove(request.params.id, request.user.id);
      response.json({ success: rowCount != 0 });
      return;
    } catch (error) {
      console.log(error);
      response.status(422).json({ success: false });
      return;
    }
    // // Then, we have to respond back with true/false based on whether the Todo was deleted or not.
    // response.send(true)
  }
);

app.use(function (err, req, res, next) {
  res.sendStatus(500);
  console.log(err);
});

module.exports = app;
