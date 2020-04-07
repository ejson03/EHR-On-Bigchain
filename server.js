const path = require('path');
const fs = require('fs');
let http = require('http');
let formidable = require('formidable');
const {
    encrypt,
    decrypt,
    decryptFile,
    hash,
    generateKeys
} = require("./utils/crypto.js")
const {
    Download,
    GetFile
} = require("./utils/ipfs.js")
const {
    createAccess,
    revokeAccess,
    generateEmail,
    generateOTP,
    showAccess,
    showRevoke,
    createAsset,
    getSingleDoctor,
    insertDetails,
    getMultipleDoctors,
    getPatient,
    getDoctorFiles,
    createPrescription
} = require("./utils/stuff.js")

const RASAUtils = require("./utils/RASA");
const RASA_URI = "http://07e546b5.ngrok.io/";

// bigchaindb connection
const API_PATH = 'http://192.168.33.160:9984/api/v1/'
const driver = require('bigchaindb-driver')
const bdb = require('easy-bigchain')
const conn = new driver.Connection(API_PATH)

const express = require('express');
let bodyParser = require('body-parser');
const app = express();
var cookieSession = require('cookie-session')
    //let session = require('express-session')
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// app.use(session({
//     secret: 'ssshhhhh',
//     resave: false,
//     saveUninitialized: true,
// }));
app.use(cookieSession({
    name: 'session',
    secret: 'ssshhhhh',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))

const router = express.Router();

app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.engine('.html', require('ejs').renderFile);

//start of main
app.get('/', function(req, res) {
    res.render('SampleScroll.html');
});
//end of main

///////////////////////////////////////////////////////////////////////////////////////////////////////
//patient start
app.get('/paitent', function(req, res) {
    res.render('patientsignfinal.html');
});
//patient end


//psignup start
app.post('/psignup', function(req, res) {

    req.session.fname = req.body.fname;
    req.session.lname = req.body.lname;
    req.session.email = req.body.email;
    req.session.pass = req.body.pass;
    req.session.dob = req.body.dob;
    req.session.gen = req.body.gen;
    req.session.phone = req.body.phone;

    let otp = generateOTP();
    console.log(otp);
    req.session.otp = otp;
    let email = req.body.email;

    console.log(email);
    const key = bdb.generateKeypair(req.session.email);
    req.session.key = key;
    console.log(req.session.key);
    generateKeys(encrypt(req.session.email))

    generateEmail(email, otp)
    res.render('otp.html');
});
//psignup end

app.post('/plogin', function(req, res) {

    let email = encrypt(req.body.email)
    let pass = encrypt(req.body.pass);
    req.session.email = req.body.email;
    const key = bdb.generateKeypair(req.session.email);
    req.session.key = key;
    console.log(req.session.key);
    (async() => {
        let data = await getPatient(email, pass)
        console.log(data)
        res.redirect('/patientaddrec')
    })();
});

app.get('/patientaccdoclist', function(req, res) {
    (async() => {
        let result = await getMultipleDoctors();
        console.log(result)
        res.render('patientaccdoclist.ejs', { 'docs': result, 'email': req.session.email });
    })();
})

app.post("/rasa/", async (req, res)=>{
    try{
    const message = req.body.message;
    const sender = req.session.email;
    const rasa = await RASAUtils.default(RASA_URI, message, sender);
    return res.json(rasa);
    }catch(err){
        console.error(err);
        return res.json([]);
    }
})

app.get('/patientmedhistory', function(req, res) {
    console.log(req.session.email);
    (async() => {
        let data = await conn.searchAssets(encrypt(req.session.email))
        console.log(data)
        res.render('patientmedhistory.ejs', { 'doc': data, 'email': req.session.email });
    })();

});

app.post('/access', function(req, res) {
    req.session.demail = req.body.value;
    console.log(req.session.demail);
    (async() => {
        let data = await showAccess(req.session.demail, req.session.email)
            // console.log("access data is....", data)
        res.render('patientaccesstrans.ejs', { 'doc': data, 'email': req.session.email });
    })();

})
app.post('/revoke', function(req, res) {
    req.session.demail = req.body.value;
    (async() => {
        let data = await showRevoke(req.session.demail, req.session.email)
            // console.log("revoke data is....", data)
        res.render('patientrevoketrans.ejs', { 'doc': data, 'email': req.session.email });
    })()
})


app.post('/logout', function(req, res) {
    req.session = null;
    res.render('SampleScroll.html');
})

app.post('/submitrec', function(req, res) {
    new formidable.IncomingForm().parse(req, (err, fields, files) => {
        if (err) {
            console.error('Error', err)
            throw err
        }
        let fpath = files.fileupload.path;
        console.log(fpath);
        console.log(fields.d);

        let data = {
            'height': encrypt(fields.height),
            'weight': encrypt(fields.weight),
            'symptoms': encrypt(fields.symptoms),
            'allergies': encrypt(fields.allergies),
            'smoking': encrypt(fields.smoking),
            'exercise': encrypt(fields.exercise),
            'description': fields.d
        };
        (async() => {
            let tx = await createAsset(data, req.session.email, fpath, req.session.key.publicKey, req.session.key.privateKey)
            console.log('Transaction', tx.id, 'successfully posted.')
            res.redirect('/patientmedhistory')
        })();
    });
});

app.get('/patientaddrec', function(req, res) {
    res.render('patientaddrec.ejs', { 'email': req.session.email });
})

app.post('/check', function(req, res) {

    let count = Object.keys(req.body).length;
    console.log(count);

    for (i = 0; i < count; i++) {
        if (req.body[i] == undefined) {
            count++;
        } else {
            console.log(i);
            console.log(req.body[i]);
            (async() => {
                await createAccess(req.body[i], req.session.key.publicKey, req.session.key.privateKey, req.session.demail, encrypt(req.session.email))
                res.redirect("/patientaddrec")
            })();
        }
    }
})

app.post('/uncheck', function(req, res) {

    let count = Object.keys(req.body).length;
    console.log(count);

    for (i = 0; i < count; i++) {
        if (req.body[i] == undefined) {
            count++;
        } else {
            console.log(i);
            console.log(req.body[i]);
            (async() => {
                await revokeAccess(req.body[i], req.session.key.publicKey, req.session.key.privateKey, req.session.demail)
                res.redirect("/patientaddrec")
            })();
        }
    }
})

app.post('/viewpres', function(req, res) {
    let demail = req.body.demail;
    console.log(demail);
    let data = [];
    (async() => {
        let assets = await conn.searchAssets(demail)
        console.log(assets.length)
        for (const id in assets) {
            let inter = await conn.searchAssets(assets[id].data.assetID)
            if (inter[0].data.email == encrypt(req.session.email)) {
                data.push({
                    'prescription': assets[0].data.prescription,
                    'file': decrypt(inter[0].data.file)
                })
            }
        }
        console.log(data)
        res.render('patientpresc.ejs', { 'doc': data, 'email': req.session.email });
    })();

});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//when clciked submit in otp page
app.post('/otp', function(req, res) {

    if (req.body.uotp == req.session.otp) {
        if (req.session.dob == null) {
            res.render('DoctorDetails.html');
        } else {
            let fn = encrypt(req.session.fname);
            let ln = encrypt(req.session.lname);
            let email = encrypt(req.session.email);
            let pass = encrypt(req.session.pass);
            let phone = encrypt(req.session.phone);
            let dob = encrypt(req.session.dob);
            let gen = encrypt(req.session.gen);
            let myobj = { fname: fn, lname: ln, email: email, password: pass, phone: phone, dob: dob, gen: gen };
            (async() => {
                let data = await insertDetails("psignup", myobj)
                res.render('patientaddrec.ejs', { 'email': req.session.email });
            })();

        }
    } else {
        console.log(req.body.uotp);
        console.log(req.session.otp);
    }

});

app.post('/view', async function(req, res) {
    console.log(req.body);
    let url1 = req.body.b;

    try {
        let buffer = await GetFile(url1);
        console.log("got file....now decrypting...")
        buffer = decryptFile(buffer.toString('utf-8'))
        buffer = new Buffer(buffer, "binary");
        console.log(buffer)

        //fs.writeFileSync('./output.pdf', buffer, 'binary');
        await Download(res, buffer);
    } catch (err) {
        console.error(err);
        return res.sendStatus(404);
    }


})

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//doctor start
app.get('/doctor', function(req, res) {
    res.render('docsignfinal.html');
});
// doc end

//signup for doctor save the data into session
app.post('/dsignup', function(req, res) {
    req.session.fname = req.body.fname;
    req.session.lname = req.body.lname;
    req.session.email = req.body.email;
    req.session.pass = req.body.pass;
    req.session.phone = req.body.phone;

    const key = bdb.generateKeypair(req.session.email);
    req.session.key = key;
    console.log(req.session.key);
    generateKeys(encrypt(req.session.email))

    let otp = generateOTP();
    console.log(otp);
    req.session.otp = otp;
    let email = req.body.email;

    console.log(email);
    generateEmail(email, otp)
    res.render('otp.html');
    // send user to the otp page

});
//end of /dsignup

app.post('/dlogin', function(req, res) {
    let email = encrypt(req.body.email);
    let pass = encrypt(req.body.pass);
    req.session.email = req.body.email;
    req.session.pass = pass
    const key = bdb.generateKeypair(req.session.email);
    req.session.key = key;
    console.log(req.session.key);
    (async() => {
        let data = await getSingleDoctor(email, pass, "login")
        console.log(data)
        res.render('docprofile.ejs', { 'data': data, 'email': req.session.email });
    })();
});

app.post('/dsave', function(req, res) {
    let spl = req.body.spl;
    console.log(spl);
    let gen = req.body.gender;
    console.log(gen);
    let cw = req.body.cw;
    console.log(cw);
    let qual = req.body.qual;
    console.log(qual);
    let fn = req.session.fname
    let ln = req.session.lname;
    let email = encrypt(req.session.email);
    let pass = encrypt(req.session.pass);
    let phone = encrypt(req.session.phone);

    let myobj = { fname: fn, lname: ln, email: email, password: pass, phone: phone, cw: cw, gen: gen, spl: spl, qual: qual };
    (async() => {
        let data = await insertDetails("dsignup", myobj)
        res.redirect('/docdetails')
    })();

})

app.get('/doclist', function(req, res) {
    (async() => {
        let data = await getDoctorFiles(encrypt(req.session.email))
        console.log(data)
        res.render('doctorasset.ejs', { 'doc': data, 'email': req.session.email });
    })();
})

app.get('/docdetails', function(req, res) {
    let email = encrypt(req.session.email);
    let pass = encrypt(req.session.pass);
    (async() => {
        let data = await getSingleDoctor(email, pass, "details")
        console.log(data)
        res.render('docprofile.ejs', { 'data': data, 'email': req.session.email });
    })();
})

app.post('/prescribe', function(req, res) {
    let id = req.body.id
    let description = req.body.description
    let pkey = req.body.pkey
    console.log(pkey)
    res.render('docprescribe.ejs', { 'email': req.session.email, 'id': id, 'description': description, 'pkey': pkey })
})

app.post('/addprescription', function(req, res) {
    let assetID = req.body.id
    let description = req.body.description
    let pkey = req.body.pkey
    let prescription = req.body.prescription
    let id = generateOTP();
    let data = {
        'email': encrypt(req.session.email),
        'assetID': assetID,
        'description': description,
        'prescription': prescription,
        'id': id
    };
    let metadata = {
        'email': encrypt(req.session.email),
        'datetime': new Date().toString(),
        'id': id
    };
    (async() => {
        let tx = await createPrescription(data, metadata, pkey, req.session.key.privateKey)
        console.log("Transction id :", tx.id)
        res.redirect('/docdetails')
    })();

})


//add the router
app.use('/', router);
app.listen(process.env.port || 8080,
    function() {
        console.log("App listening on port 8000.....")
    });