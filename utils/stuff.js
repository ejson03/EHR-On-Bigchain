const API_PATH = 'http://192.168.33.160:9984/api/v1/'
const driver = require('bigchaindb-driver')
const bdb = require('easy-bigchain')
const conn = new driver.Connection(API_PATH)
var { encryptRSA } = require("./crypto.js")

let mail = require('./email.json');
var nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: mail.email,
        pass: mail.password
    }
});
//const func1 = ()=>{some code here}

const generateOTP = () => {

    // Declare a digits variable  
    // which stores all digits 
    var digits = '0123456789';
    let OTP = '';
    for (let i = 0; i < 4; i++) {
        OTP += digits[Math.floor(Math.random() * 10)];
    }
    return OTP;
}

const generateEmail = (email, otp) => {
    var mailOptions = {
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
}

const getAsset = async(data, publicKey, privateKey, meta, kpath) => {
    var asset = await conn.searchAssets(data)
    asset.forEach(item => console.log(item.id))
    var transaction = await conn.listTransactions(asset[0].id)
    console.log(transaction.length)
    data = {
        'email': meta,
        'key': encryptRSA('d6F3Efeq', path.join(`keys/${dir}`, 'public.pem'))
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


module.exports = {
    getAsset,
    generateEmail,
    generateOTP

}