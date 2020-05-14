const {generateOTP, generateEmail} = require("../utils/utils")
const {encrypt, decryptFile } = require("../utils/crypto")
const {User} = require("../models/user.models")
const {GetFile, Download} = require("../utils/ipfs")
const {getRasaHistory, RASARequest} = require("../utils/rasa")
const {Router} = require("express")
const cors = require('cors');

const common = Router()

common.get('/', function(req, res) {
    res.render('index.html');
});

common.get('/login', function(req, res) {
    res.render('login.html');
});
common.get('/signup', function(req, res) {
    res.render('signup.html');
});

common.post('/register', function(req, res) {
    req.session.email = req.body.email;
    req.session.username = req.body.username;
    req.session.pass = req.body.pass;
    req.session.name = req.body.name;
    req.session.type = req.body.type;
    req.session.activity = "signup";
    req.session.gen = req.body.gender;
    req.session.phone = req.body.phone;
    if(req.body.qualification){
        req.session.qual = req.body.specialization;
        req.session.ins = req.body.institute;
        req.session.loc = req.boddy.location;
    }
    let otp = generateOTP();
    console.log(`${otp} is the otp for ${req.body.email}`);
    req.session.otp = otp;
    generateEmail(req.session.email, otp)
    res.render('otp.html');
});

common.post('/enter', function(req, res) {

    req.session.email = req.body.email;
    req.session.username = req.body.username;
    req.session.pass = req.body.pass;
    req.session.type = req.body.type;
    req.session.activity = "login"
    let otp = generateOTP();
    console.log(`${otp} is the otp for ${req.body.email}`);
    req.session.otp = otp;
    generateEmail(req.session.email, otp)
    res.render('otp.html');
});

common.post('/otp', function(req, res) {
    if (req.body.uotp == req.session.otp) {
        let user = new User(req.session.username, req.session.type, req.session.pass)
        if(req.session.activity == "signup"){
            let asset = {'name':req.session.name, 
                        'email':req.session.email, 
                        'schema':req.session.type, 
                        'gender':req.session.gen, 
                        'phone':req.session.phone};
            if(req.session.type == "Patient"){
                (async() => {
                    try {
                        let tx = await user.createUser(asset, req.session.pass, req.session.username);
                        req.session.user = user;
                        res.redirect("/user/home");
                    } catch (err) {
                        console.error(err);
                        return res.sendStatus(404);
                    }
                })();
            }
            else {
                (async() => {
                    try {
                        asset = {
                            ...asset,
                            'institute': req.session.ins,
                            'qualification': req.session.qual,
                            'location' : req.session.loc
                        }
                        let tx = await user.createUser(asset, req.session.pass, req.session.username)
                        req.session.user = user;
                        if(req.session.type == "clinician"){
                            res.redirect("/clinician/home");
                        } else {
                            res.redirect("/doctor/home");
                        }
                    } catch (err) {
                        console.error(err);
                        return res.sendStatus(404);
                    }
                })();
            }
        } else {
            if(req.session.type == "patient"){
                req.session.user = user;
                res.redirect("/user/home");
            } 
            else if (req.session.type == "clinician"){
                req.session.user = user;
                res.redirect("/clinician/home");
            }
            else {
                req.session.user = user;
                res.redirect("/doctor/home");
            }
        }
    } else {
        console.log(req.body.uotp);
        console.log(req.session.otp);
    }

});

common.post('/view', async function(req, res) {
    let url1 = "";
    let status = req.body.url;
    if (status == "encrypted") {
        url1 = decrypt(req.body.b);
    } else {
        url1 = req.body.b;
    }
    try {
        let buffer = await GetFile(url1);
        buffer = decryptFile(buffer.toString('utf-8'), req.session.user.secretKey)
        buffer = new Buffer(buffer, "binary");
        await Download(res, buffer);
    } catch (err) {
        console.error(err);
        return res.sendStatus(404);
    }
})

common.post("/rasa", cors(), async(req, res) => {
    try {
        const message = req.body.message;
        const sender = String(req.session.name);
        const rasa = await RASARequest(RASA_URI, message, sender);
        return res.json(rasa);
    } catch (err) {
        console.error("Error: ", err);
        return res.status(500);
    }
})

common.post("/getrasahistory", cors(), async(req, res) => {
    let email = req.body.rasa;
    try {
        let data = await getRasaHistory(email);
        console.log(data)
        res.render('patientrasahistory.ejs', { 'doc': data, 'email': req.session.email });
    } catch (err) {
        console.error("Error: ", err);
        return res.status(500);
    }
})


common.post('/logout', function(req, res) {
    req.session = null;
    res.render('index.html');
})

module.exports.common = common;