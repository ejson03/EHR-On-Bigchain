const path = require("path");
const express = require("express");
const config = require("./config");
const bodyParser = require("body-parser");
const router = require("./routes");
var flash = require("connect-flash");

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

let cookieSession = require("cookie-session");
app.use(
  cookieSession({
    name: "session",
    secret: config.secret,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours,
    credentials: "include",
  })
);
app.use(flash());

// let session = require("express-session");
// app.use(
//   session({
//     secret: config.secret,
//     resave: false,
//     saveUninitialized: true,
//     credentials: "include",
//   })
// );

app.use(express.static(path.join(__dirname, "public")));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.engine(".html", require("ejs").renderFile);

app.use("/", router);

app.listen(config.port, function () {
  console.log(`App listening on port ${config.port}`);
});
