const {
  cryptoService,
  mailService,
  vaultService,
  ipfsService,
} = require("../services");
const { User } = require("../models/user.models");

exports.signUp = async (req, res) => {
  let data = {
    email: req.body.email,
    username: req.body.username,
    name: req.body.name,
    type: req.body.type,
    activity: "signup",
    gender: req.body.gender,
    password: req.body.pass,
  };
  if (req.body.qualification) {
    data = {
      ...data,
      spec: req.body.specialization,
      ins: req.body.ins,
      loc: req.body.loc,
    };
  }
  let errors = [];

  // if (
  //   !req.body.name ||
  //   !req.body.email ||
  //   !req.body.password ||
  //   !req.body.password2
  // ) {
  //   errors.push({ msg: "Please enter all fields" });
  // }

  // if (req.body.password != req.body.password2) {
  //   errors.push({ msg: "Passwords do not match" });
  // }

  // if (req.body.password.length < 6) {
  //   errors.push({ msg: "Password must be at least 6 characters" });
  // }
  if (errors.length > 0) {
    res.render("signup.html", {
      errors,
    });
  } else {
    const users = await vaultService.getUsers();
    if (users.includes(data.username)) {
      errors.push({ msg: "User already exists" });
      res.render("signup.html", {
        errors,
      });
    } else {
      let otp = mailService.generateOTP();
      console.log(`${otp} is the otp for ${req.body.email}`);
      data = { ...data, otp: otp };
      mailService.generateEmail(req.body.email, otp);
      req.flash("details", data);
      res.render("otp.html");
    }
  }
};

exports.login = async (req, res) => {
  details.email = req.body.email;
  details.username = req.body.username;
  details.pass = req.body.pass;
  details.type = req.body.type;
  details.activity = "login";
  let otp = mailService.generateOTP();
  console.log(`${otp} is the otp for ${req.body.email}`);
  details.otp = otp;
  mailService.generateEmail(details.email, otp);
  res.render("otp.html");
};

exports.getOTP = async (req, res) => {
  let details = req.flash("details").pop();
  if (req.body.uotp == details.otp) {
    let user = new User(details.username, details.type, details.password);
    if (details.activity == "signup") {
      let asset = {
        name: details.name,
        email: details.email,
        schema: details.type,
        gender: details.gen,
      };
      if (details.type == "Patient") {
        try {
          let tx = await user.createUser(
            asset,
            details.password,
            details.username
          );
          if (!tx) {
            console.log("Error in creating the user");
            return res.sendStatus(500);
          }
          req.session.user = user;
          res.redirect("/user/home");
        } catch (err) {
          console.error(err);
          return res.sendStatus(404);
        }
      } else {
        try {
          asset = {
            ...asset,
            institute: details.ins,
            qualification: details.qual,
            location: details.loc,
          };
          let tx = await user.createUser(asset, details.pass, details.username);
          req.session.user = user;
          if (req.session.type == "clinician") {
            res.redirect("/clinician/home");
          } else {
            res.redirect("/doctor/home");
          }
        } catch (err) {
          console.error(err);
          return res.sendStatus(404);
        }
      }
    } else {
      if (details.type == "patient") {
        req.session.user = user;
        res.redirect("/user/home");
      } else if (details.type == "clinician") {
        req.session.user = user;
        res.redirect("/clinician/home");
      } else {
        details.user = user;
        res.redirect("/doctor/home");
      }
    }
  } else {
    console.log(req.body.uotp);
    console.log(details.otp);
  }
};

exports.view = async (req, res) => {
  try {
    const status = String(req.body.url);
    let url1 = "";
    if (status === "encrypted") {
      url1 = decrypt(req.body.b);
    } else {
      url1 = req.body.b;
    }

    let buffer = await GetFile(url1);
    buffer = decryptFile(buffer.toString("utf-8"), req.session.user.secretKey);
    buffer = new Buffer(buffer, "binary");
    await Download(res, buffer);
  } catch (err) {
    console.error(err);
    return res.sendStatus(404);
  }
};

exports.rasa = async (req, res) => {
  try {
    const message = req.body.message;
    const sender = String(req.session.name);
    const rasa = await RASARequest(RASA_URI, message, sender);
    return res.json(rasa);
  } catch (err) {
    console.error("Error: ", err);
    return res.status(500);
  }
};

exports.rasaHistory = async (req, res) => {
  let email = req.body.rasa;
  try {
    let data = await getRasaHistory(email);
    console.log(data);
    res.render("patientrasahistory.ejs", {
      doc: data,
      email: req.session.email,
    });
  } catch (err) {
    console.error("Error: ", err);
    return res.status(500);
  }
};
