const path = require('path');
const fs = require('fs');
var http = require('http');
var formidable = require('formidable');
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
    getAsset,
    generateEmail,
    generateOTP
} = require("./utils/stuff.js")

// mongo connection
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://192.168.33.160:27017/";

// ipfs connection
const ipfsAPI = require('ipfs-api');
const ipfs = ipfsAPI('ipfs.infura.io', '5001', { protocol: 'https' })

// bigchaindb connection
const API_PATH = 'http://192.168.33.160:9984/api/v1/'
const driver = require('bigchaindb-driver')
const bdb = require('easy-bigchain')
const conn = new driver.Connection(API_PATH)

const express = require('express');
var bodyParser = require('body-parser');
const app = express();
var session = require('express-session')
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'ssshhhhh',
    resave: false,
    saveUninitialized: true,
}));

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

//doctor start
app.get('/doctor', function(req, res) {
    res.render('docsignfinal.html');
});
// doc end

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

    var otp = generateOTP();
    console.log(otp);
    req.session.otp = otp;
    var email = req.body.email;

    console.log(email);
    const key = bdb.generateKeypair(req.session.email);
    req.session.key = key;
    console.log(req.session.key);
    generateKeys(encrypt(req.session.email))

    generateEmail(email, otp)
    res.render('otp.html');
});
//psignup end

//signup for doctor save the data into session
app.post('/dsignup', function(req, res) {
    req.session.fname = req.body.fname;
    req.session.lname = req.body.lname;
    req.session.email = req.body.email;
    req.session.pass = req.body.pass;
    req.session.phone = req.body.phone;

    console.log(email);
    const key = bdb.generateKeypair(req.session.email);
    req.session.key = key;
    console.log(req.session.key);
    generateKeys(encrypt(req.session.email))

    var otp = generateOTP();
    console.log(otp);
    req.session.otp = otp;
    var email = req.body.email;

    console.log(email);
    generateEmail(email, otp)
    res.render('otp.html');
    // send user to the otp page

});
//end of /dsignup


//when clciked submit in otp page
app.post('/otp', function(req, res) {

    if (req.body.uotp == req.session.otp) {
        var fn = encrypt(req.session.fname);
        console.log(fn);
        var ln = encrypt(req.session.lname);
        console.log(ln);
        var email = encrypt(req.session.email);
        console.log(email);
        var pass = encrypt(req.session.pass);
        console.log(pass);
        var phone = encrypt(req.session.phone);
        console.log(phone);

        if (req.session.dob == null) {

            res.render('DoctorDetails.html');

        } else {
            console.log(req.session.dob);
            var dob = encrypt(req.session.dob);
            var gen = encrypt(req.session.gen);
            MongoClient.connect(url, function(err, db) {
                if (err) throw err;
                var dbo = db.db("project");
                var myobj = { fname: fn, lname: ln, email: email, password: pass, phone: phone, dob: dob, gen: gen };
                dbo.collection("psignup").insertOne(myobj, function(err, res) {
                    if (err) throw err
                    console.log("1 document inserted");
                    db.close();
                });
            });
            console.log("suceesful signup...redirected shortly...");
            res.render('patientaddrec.ejs', { 'email': req.session.email });
        }
    } else {
        console.log(req.body.uotp);
        console.log(req.session.otp);
    }

});


app.post('/plogin', function(req, res) {

    var email = encrypt(req.body.email)
    var pass = encrypt(req.body.pass);
    req.session.email = req.body.email;
    const key = bdb.generateKeypair(req.session.email);
    req.session.key = key;
    console.log(req.session.key);

    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("project");

        //Find the first document in the customers collection:
        dbo.collection("psignup").findOne({ email: email }, function(err, resu) {
            if (err) throw err;
            if (email == resu.email && pass == resu.password) {
                console.log("suceesful login...redirected shortly...");
                res.render('patientaddrec.ejs', { 'email': req.session.email });

            } else {
                console.log("not okay");
            }

            db.close();

        });
    });

});

app.post('/dlogin', function(req, res) {
    var email = encrypt(req.body.email);
    var pass = encrypt(req.body.pass);
    console.log(email);
    req.session.email = req.body.email;
    const key = bdb.generateKeypair(req.session.email);
    req.session.key = key;
    console.log(req.session.key);
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("project");
        //Find the first document in the customers collection:
        dbo.collection("dsignup").findOne({ email: email }, function(err, result) {
            if (err) throw err;
            console.log(result);
            if (email == result.email && pass == result.password) {
                res.render('patientaddrec.html');
                console.log("hello");
            } else {
                console.log("not okay");
            }
        });
        db.close();
    });
});

app.post('/dsave', function(req, res) {
    var fn = req.session.fname;

    var uni = req.body.uni;
    console.log(uni);
    var spl = req.body.spl;
    console.log(spl);
    var wh1 = req.body.wh1;
    console.log(wh1);
    var wh = req.body.wh;
    console.log(wh);
    var we = req.body.we;
    console.log(we);
    var gen = req.body.gender;
    console.log(gen);
    var cw = req.body.cw;
    console.log(cw);
    var qual = req.body.qual;
    console.log(qual);
    var ca = req.body.ca;
    console.log(ca);


    var ln = req.session.lname;

    var email = encrypt(req.session.email);

    var pass = encrypt(req.session.pass);

    var phone = encrypt(req.session.phone);
    const keys = new driver.Ed25519Keypair()
    var epublic = encrypt(keys.publicKey);
    var eprivate = encrypt(keys.privateKey);
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("project");
        var myobj = { fname: fn, lname: ln, email: email, password: pass, phone: phone, cw: cw, gen: gen, uni: uni, spl: spl, qual: qual, ca: ca, pubkey: epublic, privkey: eprivate };
        dbo.collection("dsignup").insertOne(myobj, function(err, res) {
            if (err) throw err
            console.log("1 document inserted");

            dbo.collection('dsignup').find({}).toArray(function(err, result) {
                if (err) throw err;

                console.log(result);

                res.render('patientprofile.ejs', { 'docs': result });
                db.close();
            });
        });

    });

});
app.get('/patientdoclist', function(req, res) {
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var db1 = db.db("project");
        db1.collection('dsignup').find({}).toArray(function(err, result) {
            if (err) throw err;
            res.render('patientdoclist.ejs', { 'docs': result, 'email': req.session.email });
        })
    });
})
app.get('/patientmedhistory', function(req, res) {
    console.log(req.session.email)
    conn.searchAssets(encrypt(req.session.email))
        .then((data) => {
            console.log(data)
            res.render('patientmedhistory.ejs', { 'doc': data, 'email': req.session.email });
        })
});

app.post('/access', function(req, res) {
    req.session.demail = req.body.value;
    console.log(req.session.demail)
    conn.searchAssets(encrypt(req.session.email))
        .then((data) => {
            console.log(data)
            res.render('patientaccesstrans.ejs', { 'doc': data, 'email': req.session.email });

        })
})

app.post('/logout', function(req, res) {
    req.session.destroy();
    res.render('SampleScroll.html');
})

app.post('/submitrec', function(req, res) {
    new formidable.IncomingForm().parse(req, (err, fields, files) => {
        console.log("hello");
        if (err) {
            console.error('Error', err)
            throw err
        }
        console.log("heyy");
        var fpath = files.fileupload.path;
        console.log(fpath);
        console.log(fields.d);

        //Reading file from computer
        let file = fs.readFileSync(fpath);
        //Creating buffer for ipfs function to add file to the system
        let cipher = encrypt(file);
        let fileBuffer = new Buffer(cipher);

        //Addfile router for adding file a local file to the IPFS network without any local node

        ipfs.files.add(fileBuffer, function(err, filee) {
            if (err) {
                console.log(err);
            }
            console.log(filee[0].hash);
            var a = encrypt(filee[0].hash);
            var id = generateOTP();

            const assetdata = {
                'email': encrypt(req.session.email),
                'file': a,
                'fileHash': hash(cipher),
                'id': id,
                'description': fields.d,
            }

            const metadata = {
                'email': encrypt(req.session.email),
                'datetime': new Date().toString(),
                'doclist': [],
                'id': id
            }

            // Construct a transaction payload
            const txCreateAliceSimple = driver.Transaction.makeCreateTransaction(
                assetdata,
                metadata,

                // A transaction needs an output
                [driver.Transaction.makeOutput(
                    driver.Transaction.makeEd25519Condition(req.session.key.publicKey))],
                req.session.key.publicKey
            )

            // Sign the transaction with private keys of Alice to fulfill it
            const txCreateAliceSimpleSigned = driver.Transaction.signTransaction(txCreateAliceSimple, req.session.key.privateKey)

            // Send the transaction off to BigchainDB
            conn.postTransactionCommit(txCreateAliceSimpleSigned)
                .then(retrievedTx => {
                    console.log('Transaction', retrievedTx.id, 'successfully posted.')
                    res.redirect('/patientmedhistory')
                })
                // With the postTransactionCommit if the response is correct, then the transaction
                // is valid and commited to a block
                //res.redirect('/patientmedhistory')

        });
    });
});

app.get('/patientaddrec', function(req, res) {
    res.render('patientaddrec.ejs', { 'email': req.session.email });
})

app.post('/view', async function(req, res) {
    console.log(req.body);
    var url = 'https://ipfs.io/ipfs/'
    var url1 = decrypt(req.body.b);
    var url2 = url + url1;
    console.log(url2)
        // ipfs.files.get(url1, function(err, file) {
        //         if (err) {
        //             console.log(err);
        //         }
        //         let data = file[0].content
        //         let buffer = decryptFile(data.toString('utf-8'))
        //         console.log(buffer)
        //         fs.writeFileSync('./tmp/output.pdf', buffer, 'binary');
        //     })
        //     open(url2, function(err) {
        //         if (err) throw err;
        //     });
        //     res.end()

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

app.post('/check', function(req, res) {

    var count = Object.keys(req.body).length;
    console.log(count);

    for (i = 0; i < count; i++) {
        if (req.body[i] == undefined) {
            count++;
        } else {
            console.log(i);
            console.log(req.body[i]);
            getAsset(req.body[i], req.session.key.publicKey, req.session.key.privateKey, req.session.demail, encrypt(req.session.email))
                .then(data => res.redirect("/patientaddrec"))
        }
    }
})

// app.get('/docrec', function(rq, res) {
//     var metadata =
// })

//add the router
app.use('/', router);
app.listen(process.env.port || 8080,
    function() {
        console.log("App listening on port 8000.....")
    });