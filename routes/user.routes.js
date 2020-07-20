const { Router } = require("express");
const { userController } = require("../controllers");

const userRouter = Router();
module.exports = userRouter;

userRouter.get("/doctorlist", userController.getDoctorList);

userRouter.get("/medicalhistory", userController.getMedicalHistory);

userRouter.post("/access", userController.postAccess);
userRouter.post("/revoke", userController.postRevoke);

userRouter.get("/home", function (req, res) {
  console.log(req.session.username);
  res.render("patientaddrec.ejs");
});

userRouter.post("/check", userController.check);

userRouter.post("/uncheck", userController.uncheck);

userRouter.post("/prescription", userController.prescription);

userRouter.post("/assethistory", userController.assetHistory);

userRouter.post("/add", userController.addRecord);
