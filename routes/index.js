"use strict";

const express = require("express");
const router = express.Router();
const commonRouter = require("./common.routes");
const userRouter = require("./user.routes");
const doctorRouter = require("./doctor.routes");

router.get("/status", (req, res) => {
  res.send({ status: "OK" });
});

router.use("/", commonRouter);
router.use("/user", userRouter);
router.use("/doctor", doctorRouter);

module.exports = router;
