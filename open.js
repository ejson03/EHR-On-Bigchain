const express = require('express');
const app = express();
const path = require('path');
const router = express.Router();
var session = require('express-session')
var nodemailer = require('nodemailer');
const driver = require('bigchaindb-driver')
var crypto = require('crypto');
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://192.168.33.160:27017/";
const ipfsAPI = require('ipfs-api');
const fs = require('fs');
var http = require('http');
var formidable = require('formidable');
const API_PATH = 'http://192.168.33.160:9984/api/v1/'
const ipfs = ipfsAPI('ipfs.infura.io', '5001', { protocol: 'https' })
const bdb = require('easy-bigchain')
const conn = new driver.Connection(API_PATH)
var Duplex = require('stream').Duplex
var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'ssshhhhh',
    resave: false,
    saveUninitialized: true,
}));
let mail = require('./email.json');

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: mail.email,
        pass: mail.password
    }
});

function encrypt(text) {
    var cipher = crypto.createCipher('aes-256-cbc', 'd6F3Efeq')
    var crypted = cipher.update(text, 'utf8', 'hex')
    crypted += cipher.final('hex');
    return crypted;
}

function decrypt(text) {
    var decipher = crypto.createDecipher('aes-256-cbc', 'd6F3Efeq')
    var dec = decipher.update(text, 'hex', 'utf8')
    dec += decipher.final('utf8');
    return dec;
}



function decryptFile(text) {
    var decipher = crypto.createDecipher('aes-256-cbc', 'd6F3Efeq')
    var dec = decipher.update(text, 'hex', 'binary')
    dec += decipher.final('binary');
    return dec;
}

// function encryptKey(publicKey, key) {
//     var k = new Buffer(key)
//     return crypto.publicEncrypt(publicKey, k).toString("base64");
// }

// function decryptKey(privateKey, key) {
//     return crypto.privateDecrypt(privateKey, key)
// }

function hash(text) {
    return crypto.createHash('sha1').update(JSON.stringify(text)).digest('hex')
}

function generateOTP() {

    // Declare a digits variable  
    // which stores all digits 
    var digits = '0123456789';
    let OTP = '';
    for (let i = 0; i < 4; i++) {
        OTP += digits[Math.floor(Math.random() * 10)];
    }
    return OTP;
}

function BufferToStream(buffer) {
    const stream = new Duplex();
    stream.push(buffer);
    stream.push(null);
    return stream;
}

function Download(res, buffer) {
    return new Promise((resolve, reject) => {
        return BufferToStream(buffer)
            .pipe(res)
            .on('error', (error) => {
                res.sendStatus(404);
                resolve();
            })
            .on('finish', function() {
                console.log("done")
                resolve()
            })
            .on('end', function() {
                console.log("end")
                resolve()
            });
    });
}


async function GetFile(ipfsName) {
    const files = await ipfs.files.get(ipfsName);
    return (files[0].content);
}
async function getAsset(data, publicKey, privateKey, meta) {
    var asset = await conn.searchAssets(data)
    asset.forEach(item => console.log(item.id))
    var transaction = await conn.listTransactions(asset[0].id)
    console.log(transaction.length)
        // data = {
        //     'email': meta,
        //     'key': encryptKey(publicKey, 'd6F3Efeq')
        // }
    console.log(transaction[transaction.length - 1].metadata)
    metadata = transaction[transaction.length - 1].metadata
    metadata['doclist'].push(meta)
    metdata = JSON.stringify(metadata)
    console.log("metadata is ", metadata)


    const txTransferBob = driver.Transaction.makeTransferTransaction(

            [{ tx: transaction[transaction.length - 1], output_index: 0 }], [driver.Transaction.makeOutput(driver.Transaction.makeEd25519Condition(publicKey))],
            metadata
        )
        // Sign with alice's private key
    let txTransferBobSigned = driver.Transaction.signTransaction(txTransferBob, privateKey)

    // Post with commit so transaction is validated and included in a block
    transfer = await conn.postTransactionCommit(txTransferBobSigned)
    console.log(transfer.id)
}



app.use(express.static(path.join('D:/Desktop/project/EHR/images')));
app.set('view engine', 'ejs');
//start of main
app.get('/', function(req, res) {

    res.sendFile('D:/Desktop/project/EHR/split-landing-page/dist/SampleScroll.html');

});
//end of main


//doctor start
app.get('/doctor', function(req, res) {
    res.sendFile(path.join('D:/Desktop/project/EHR/day-001-login-form/dist/docsignfinal.html'));
});
// doc end

//patient start
app.get('/paitent', function(req, res) {
    res.sendFile(path.join('D:/Desktop/project/EHR/day-001-login-form/dist/patientsignfinal.html'));
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
    var emailtext = generateOTP();
    console.log(emailtext);
    req.session.otp = emailtext;
    var email = req.body.email;
    console.log(email);
    var mailOptions = {
        from: mail.email,
        to: email,
        subject: 'Sending Email using Node.js',
        text: emailtext
    };
    transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
    res.sendFile(path.join('D:/Desktop/project/EHR/otp.html'));
});
//psignup end

//signup for doctor save the data into session
app.post('/dsignup', function(req, res) {
    req.session.fname = req.body.fname;
    req.session.lname = req.body.lname;
    req.session.email = req.body.email;
    req.session.pass = req.body.pass;
    req.session.phone = req.body.phone;
    var emailtext = generateOTP();
    console.log(emailtext);
    req.session.otp = emailtext;
    var email = req.body.email;
    console.log(email);
    var mailOptions = {
        from: mail.email,
        to: email,
        subject: 'Sending Email using Node.js',
        text: emailtext
    };
    transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
    res.sendFile(path.join('D:/Desktop/project/EHR/otp.html'));
    // send user to the otp page

});
//end of /dsignup


//when clciked submit in otp page
app.post('/otp', function(req, res) {
    console.log(req.session.lname);
    if (req.body.uotp = req.session.otp) {
        var fn = encrypt(req.session.fname);

        console.log(fn);

        var ln = encrypt(req.session.lname);
        console.log(ln);
        var email = encrypt(req.session.email);
        console.log(email);
        var pass = encrypt(req.session.pass);
        console.log(pass);
        var phone = encrypt(req.session.phone);

        console.log(ln);
        console.log(phone);

        if (req.session.dob == null) {

            res.sendFile(path.join('D:/Desktop/project/EHR/DoctorDetails.html'));
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
        }
    } else {
        console.log(req.body.uotp);
        console.log(req.session.otp);
    }

});


app.post('/plogin', function(req, res) {

    var email = encrypt(req.body.email)
    var pass = encrypt(req.body.pass);
    req.session.email = email;
    const key = bdb.generateKeypair(req.session.email);
    req.session.key = key;
    console.log(req.session.key);

    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("project");

        //Find the first document in the customers collection:
        dbo.collection("psignup").findOne({ email: req.session.email }, function(err, resu) {
            if (err) throw err;
            if (email == resu.email && pass == resu.password) {
                console.log("suceesful login...redirected shortly...");
                res.render('D:/Desktop/project/EHR/latestpatientprof1/patientaddrec.ejs', { 'email': decrypt(req.session.email) });

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
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("project");
        //Find the first document in the customers collection:
        dbo.collection("dsignup").findOne({ email: email }, function(err, result) {
            if (err) throw err;
            console.log(result);
            if (email == result.email && pass == result.password) {
                res.sendFile('D:/Desktop/project/EHR/latestpatientprof1/patientaddrec.html');
                console.log("hello");


            } else {
                console.log("not okay");
            }
        });
        db.close();
    });


    res.sendFile(path.join('D:/Desktop/project/EHR/DoctorDetails.html'));
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

                res.render('D:/Desktop/project/EHR/patientprofile.ejs', { 'docs': result });
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
            res.render('D:/Desktop/project/EHR/latestpatientprof1/patientdoclist.ejs', { 'docs': result, 'email': decrypt(req.session.email) });
        })
    });
})
app.get('/patientmedhistory', function(req, res) {
    conn.searchAssets(decrypt(req.session.email))
        .then((data) => {
            console.log(data)
            res.render('D:/Desktop/project/EHR/latestpatientprof1/patientmedhistory.ejs', { 'doc': data, 'email': decrypt(req.session.email) });
        })
});

app.post('/access', function(req, res) {
    req.session.demail = req.body.value;
    console.log(req.session.demail)
    conn.searchAssets(decrypt(req.session.email))
        .then((data) => {
            console.log(data)
            res.render('D:/Desktop/project/EHR/latestpatientprof1/patientaccesstrans.ejs', { 'doc': data, 'email': decrypt(req.session.email) });

        })
})

app.post('/logout', function(req, res) {
    req.session.destroy();
    res.sendFile(path.join('D:/Desktop/project/EHR/split-landing-page/dist/SampleScroll.html'));
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
                'email': decrypt(req.session.email),
                'file': a,
                'fileHash': hash(cipher),
                'id': id,
                'description': fields.d,
            }

            const metadata = {
                'email': req.session.email,
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
            const conn = new driver.Connection(API_PATH)

            conn.postTransactionCommit(txCreateAliceSimpleSigned)
                .then(retrievedTx => console.log('Transaction', retrievedTx.id, 'successfully posted.'))
                // With the postTransactionCommit if the response is correct, then the transaction
                // is valid and commited to a block

        });
    });
});

app.get('/patientaddrec', function(req, res) {
    res.render('D:/Desktop/project/EHR/latestpatientprof1/patientaddrec.ejs', { 'email': decrypt(req.session.email) });
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
            getAsset(req.body[i], req.session.key.publicKey, req.session.key.privateKey, decrypt(req.session.demail));
        }
    }

})
app.get('/revoke', function(req, res) {
    var e = 0;
    var rest = [];
    var reslen = 0;

    function abc(callback) {

        MongoClient.connect(url, function(err, db) {
            if (err) throw err;
            var dbo = db.db("bigchain");
            //Find the first document in the customers collection:

            dbo.collection("metadata").find({ 'metadata.email': 'f3c3b4b656bf5b8d152087ce31825e0994f918874805020b05ff8f1e89163b03' }).toArray(function(err, result) {
                for (var i = 0; i < result.length; i++) {
                    var a = result[i].metadata.doclist;

                    if (a.length == '0') {
                        continue;

                    } else {
                        //console.log(result[i].metadata);

                        //console.log(result);

                        dbo.collection("assets").find({ 'data.id': result[i].metadata.id }).toArray(function(err, resu) {

                            reslen = reslen + 1;

                            rest = rest.concat(resu);
                            callback();
                            db.close();



                        });
                    }
                }

            });
        });

    }


    abc(function() {
        console.log(rest);

        console.log(rest.length);
        if (rest.length == '4') {
            res.render('D:/Desktop/project/EHR/latestpatientprof1/patientrevokeaccess.ejs', { 'doc': rest });
        }
    })
})

//add the router
app.use('/', router);
app.listen(process.env.port || 8080);