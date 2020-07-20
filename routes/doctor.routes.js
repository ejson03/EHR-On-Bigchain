const { Router } = require("express");
const { doctorController } = require("../controllers");

const doctorRouter = Router();
module.exports = doctorRouter;

doctorRouter.get("/list", doctorController.getFiles);

doctorRouter.get("/home", doctorController.getDetails);

doctorRouter.post("/prescribe", doctorController.getPrescription);

doctorRouter.post("/prescription", doctorController.postPrescription);
