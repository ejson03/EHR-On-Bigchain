const cors = require("cors");
const { Router } = require("express");

const { commonController } = require("../controllers");
const commonRouter = Router();
module.exports = commonRouter;
commonRouter.get("/", function (req, res) {
  res.render("index.html");
});

commonRouter.get("/login", function (req, res) {
  res.render("login.html");
});
commonRouter.get("/signup", function (req, res) {
  res.render("signup.html");
});

commonRouter.post("/signup", commonController.signUp);
commonRouter.post("/login", commonController.login);
commonRouter.post("/otp", commonController.getOTP);

commonRouter.post("/view", commonController.view);

commonRouter.post("/rasa", cors(), commonController.rasa);

// commonRouter.post("/getrasahistory", cors(),);

commonRouter.post("/logout", function (req, res) {
  req.session = null;
  res.render("index.html");
});
