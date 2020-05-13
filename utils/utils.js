let mail = require('./email.json');
let nodemailer = require('nodemailer');


let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: mail.email,
        pass: mail.password
    }
});
    


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

const generateOTP = () => {

    let digits = '0123456789';
    let OTP = '';
    for (let i = 0; i < 4; i++) {
        OTP += digits[Math.floor(Math.random() * 10)];
    }
    return OTP;
};

module.exports = {
    generateEmail,
    generateOTP
}