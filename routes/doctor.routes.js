const {Router} = require("express")
const {createAsset} = require("../utils/bigchain")
const {getDoctorFiles} = require('../utils/stuff')
const {generateOTP} = require("../utils/utils")

const doctor = Router()
module.exports.doctor = doctor;

doctor.get('/list', function(req, res) {
    (async() => {
        try {
            let data = await getDoctorFiles(req.session.email)
            console.log(data)
            res.render('doctorasset.ejs', { 'doc': data});
        } catch (err) {
            console.error(err);
            return res.sendStatus(404);
        }

    })();
})

doctor.get('/home', function(req, res) {
    (async() => {
        try {
            res.render('docprofile.ejs', { 'data': req.session.user.user});
        } catch (err) {
            console.error(err);
            return res.sendStatus(404);
        }
    })();
})

doctor.post('/prescribe', function(req, res) {
    let id = req.body.id
    let description = req.body.description
    let pkey = req.body.pkey
    console.log(pkey)
    res.render('docprescribe.ejs', { 'id': id, 'description': description, 'pkey': pkey })
})

doctor.post('/prescription', function(req, res) {
    let assetID = req.body.id
    let description = req.body.description
    let pkey = req.body.pkey
    let prescription = req.body.prescription
    let id = generateOTP();
    let data = {
        'email': req.session.email,
        'assetID': assetID,
        'description': description,
        'prescription': prescription,
        'id': id
    };
    let metadata = {
        'email': req.session.email,
        'datetime': new Date().toString(),
        'id': id
    };
    (async() => {
        try {
            let tx = await createAsset(data, metadata, pkey, req.session.key.privateKey)
            console.log("Transction id :", tx.id)
            res.redirect('/doctor/home')
        } catch (err) {
            console.error(err);
            return res.sendStatus(404);
        }
    })();

})
