let { encryptRSA, encrypt, hash, decrypt } = require("./crypto.js")
const path = require('path');
const fs = require('fs');
//ipfs connection
const ipfsAPI = require('ipfs-api');
const ipfs = ipfsAPI('ipfs.infura.io', '5001', { protocol: 'https' });
// mongo connection
let MongoClient = require('mongodb').MongoClient;
let url = "mongodb://192.168.33.160:27017/";
// bigchaindb connection
const API_PATH = 'http://192.168.33.160:9984/api/v1/'
const driver = require('bigchaindb-driver')
const conn = new driver.Connection(API_PATH)


let mail = require('./email.json');
let nodemailer = require('nodemailer');
let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: mail.email,
        pass: mail.password
    }
});

///////////////////////////////////////////////////////////////////////////////////////////////////////
const generateOTP = () => {

    // Declare a digits letiable  
    // which stores all digits 
    let digits = '0123456789';
    let OTP = '';
    for (let i = 0; i < 4; i++) {
        OTP += digits[Math.floor(Math.random() * 10)];
    }
    return OTP;
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////
const generateEmail = (email, otp) => {
    let mailOptions = {
        from: mail.email,
        to: email,
        subject: 'Sending Email using Node.js',
        text: otp
    };
    transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////
const createAccess = async(dlist, publicKey, privateKey, meta, kpath) => {
    for (index in dlist) {
        let asset = await conn.searchAssets(dlist[index])
        let transaction = await conn.listTransactions(asset[0].id)
        console.log(transaction.length)
        data = {
            'email': meta,
            'key': encryptRSA('d6F3Efeq', path.join(`keys/${kpath}`, 'public.pem'))
        }
        console.log(transaction[transaction.length - 1].metadata)
        metadata = transaction[transaction.length - 1].metadata
        metadata['doclist'].push(data)
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


};
////////////////////////////////////////////////////////////////////////////////////////////////////////////

const revokeAccess = async(dlist, publicKey, privateKey, meta) => {
    for (index in dlist) {
        let asset = await conn.searchAssets(dlist[index])
        let transaction = await conn.listTransactions(asset[0].id)
        console.log(transaction[transaction.length - 1].metadata)
        let metadata = transaction[transaction.length - 1].metadata
        let doclist = metadata.doclist
        console.log("Before", doclist.length)
        doclist = doclist.filter(item => item.email != meta)
        console.log("After", doclist.length)
        metadata.doclist = doclist
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
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////

const showAccess = async(demail, email) => {
    let assets = await conn.searchAssets(encrypt(email))
    let data = []
    for (const asset of assets) {
        transaction = await conn.listTransactions(asset.id)
        doclist = transaction[transaction.length - 1].metadata.doclist
        let result = doclist.filter(st => st.email.includes(demail))
        if (result.length == 0) {
            data.push(asset)
        }
    }
    return data
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////

const showRevoke = async(demail, email) => {
    let assets = await conn.searchAssets(encrypt(email))
    let data = []

    for (const asset of assets) {
        transaction = await conn.listTransactions(asset.id)
        doclist = transaction[transaction.length - 1].metadata.doclist
        let result = doclist.filter(st => st.email.includes(demail))
        if (result.length != 0) {
            data.push(asset)
        }
    }
    return data
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////
const createAsset = async(data, email, fpath, publicKey, privateKey) => {
    let file = fs.readFileSync(fpath);
    let cipher = encrypt(file);
    let fileBuffer = new Buffer(cipher);

    let fileIPFS = await ipfs.files.add(fileBuffer)
    console.log("IPFS hash: ", fileIPFS[0].hash);
    let fileIPFSEncrypted = encrypt(fileIPFS[0].hash);
    let id = generateOTP();

    data['email'] = encrypt(email)
    data['file'] = fileIPFSEncrypted
    data['fileHash'] = hash(cipher)
    data['id'] = id


    const metadata = {
        'email': encrypt(email),
        'datetime': new Date().toString(),
        'doclist': [],
        'id': id
    }

    // Construct a transaction payload
    const txCreateAliceSimple = driver.Transaction.makeCreateTransaction(
        data,
        metadata,

        // A transaction needs an output
        [driver.Transaction.makeOutput(
            driver.Transaction.makeEd25519Condition(publicKey))],
        publicKey
    )

    // Sign the transaction with private keys of Alice to fulfill it
    const txCreateAliceSimpleSigned = driver.Transaction.signTransaction(txCreateAliceSimple, privateKey)

    // Send the transaction off to BigchainDB
    tx = await conn.postTransactionCommit(txCreateAliceSimpleSigned)
    return tx
};
///////////////////////////////////////////////////////////////////////////////////////////////////////////
const getSingleDoctor = async(email, pass, action) => {
    let data = {}
    let db = await MongoClient.connect(url);
    let dbo = db.db("project");
    let result = await dbo.collection("dsignup").findOne({ email: email });
    console.log(result);
    if (action == "login") {
        if (email == result.email && pass == result.password) {
            data = {
                'email': decrypt(result.email),
                'name': `${result.fname} ${result.lname}`,
                'qualification': result.qual,
                'specialty': result.spl,
                'current': result.cw
            }
            console.log("login succesful.........");
        } else {
            console.log("not okay");
        }
    } else {
        data = {
            'email': decrypt(result.email),
            'name': `${result.fname} ${result.lname}`,
            'qualification': result.qual,
            'specialty': result.spl,
            'current': result.cw
        }
        console.log("Retrieved dctor deatilas successfully.....");
    }
    db.close();
    return data;

};
///////////////////////////////////////////////////////////////////////////////////////////////
const insertDetails = async(collection, myobj) => {
    let db = await MongoClient.connect(url);
    let dbo = db.db("project");
    let result = await dbo.collection(collection).insertOne(myobj);
    console.log(`Inserted detils into ${collection}`);
    db.close();
    return result
};
/////////////////////////////////////////////////////////////////////////////////////////////////
const getMultipleDoctors = async() => {
    let db = await MongoClient.connect(url);
    let dbo = db.db("project");
    let result = await dbo.collection('dsignup').find({}).toArray();
    return result
};
/////////////////////////////////////////////////////////////////////////////////////////////////
const getPatient = async(email, pass) => {
    let data = {}
    let db = await MongoClient.connect(url);
    let dbo = db.db("project");
    let result = await dbo.collection("psignup").findOne({ email: email });

    console.log(result);
    if (email == result.email && pass == result.password) {
        db.close();
        data = { 'email': result.email }
        return data;
    } else {
        db.close();
        console.log("not okay");
    }
};
///////////////////////////////////////////////////////////////////////////////////////////////////
const getDoctorFiles = async(email) => {
    let metadata = await conn.searchMetadata(email);
    let data = [];
    let assetlist = new Set();

    for (const meta of metadata) {
        tx = await conn.listTransactions(meta.id)
        assetlist.add(tx[tx.length - 1].asset.id)
    }
    assetlist = [...assetlist]
    assetlist = assetlist.filter(function(element) {
        return element !== undefined;
    });
    for (const asset of assetlist) {
        tx = await conn.listTransactions(asset)
        docs = tx[tx.length - 1].metadata.doclist
        let result = docs.filter(st => st.email.includes(email))
        if (result.length != 0) {
            let ass = await conn.searchAssets(asset)

            data.push({
                'email': decrypt(ass[0].data.email),
                'file': decrypt(ass[0].data.file),
                'description': ass[0].data.description,
                'id': asset,
                'pkey': tx[tx.length - 1].outputs[0].public_keys[0]
            })
        }
    }
    console.log(data)
    return data;
};
//////////////////////////////////////////////////////////////////////////////////////////////////

const createPrescription = async(data, metadata, patientPublicKey, privateKey) => {
    console.log(privateKey)
    const txCreateAliceSimple = driver.Transaction.makeCreateTransaction(
        data,
        metadata, [driver.Transaction.makeOutput(
            driver.Transaction.makeEd25519Condition(patientPublicKey))],
        patientPublicKey
    )
    const txCreateAliceSimpleSigned = driver.Transaction.signTransaction(txCreateAliceSimple, privateKey)
    tx = await conn.postTransactionCommit(txCreateAliceSimpleSigned)
    return tx
};
//////////////////////////////////////////////////////////////////////////////////////////////////



module.exports = {
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

}