const { getDoctorFiles } = require("../utils/stuff");
const { bigchainService, mailService } = require("../services");

exports.getFiles = async (req, res) => {
  try {
    let data = await bigchainService.getDoctorFiles(req.session.email);
    console.log(data);
    res.render("doctorasset.ejs", { doc: data });
  } catch (err) {
    console.error(err);
    return res.sendStatus(404);
  }
};

exports.getDetails = async (req, res) => {
  try {
    res.render("docprofile.ejs", { data: req.session.user.user });
  } catch (err) {
    console.error(err);
    return res.sendStatus(404);
  }
};

exports.getPrescription = async (req, res) => {
  let id = req.body.id;
  let description = req.body.description;
  let pkey = req.body.pkey;
  console.log(pkey);
  res.render("docprescribe.ejs", {
    id: id,
    description: description,
    pkey: pkey,
  });
};

exports.postPrescription = async (req, res) => {
  let assetID = req.body.id;
  let description = req.body.description;
  let pkey = req.body.pkey;
  let prescription = req.body.prescription;
  let id = mailService.generateOTP();
  let data = {
    email: req.session.email,
    assetID: assetID,
    description: description,
    prescription: prescription,
    id: id,
  };
  let metadata = {
    email: req.session.email,
    datetime: new Date().toString(),
    id: id,
  };
  try {
    let tx = await createAsset(
      data,
      metadata,
      pkey,
      req.session.key.privateKey
    );
    console.log("Transction id :", tx.id);
    res.redirect("/doctor/home");
  } catch (err) {
    console.error(err);
    return res.sendStatus(404);
  }
};
