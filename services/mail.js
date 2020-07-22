let config = require("../config");
let nodemailer = require("nodemailer");

let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: config.email.mail,
    pass: config.email.password,
  }
});

const generateEmail = async (email, otp) => {
  const mailOptions = {
    from: config.email.mail,
    to: email,
    subject: "Medical Analytica Joiner",
    text: otp,
  };
  try {
    const sentMessageInfo = await transporter.sendMail(mailOptions);
    console.log("Email sent: " + sentMessageInfo.response);
  } catch (error) {
    console.log(error);
  }
};

const generateOTP = () => {
  let digits = "0123456789";
  let OTP = "";
  for (let i = 0; i < 4; i++) {
    OTP += digits[Math.floor(Math.random() * 10)];
  }
  return OTP;
};

module.exports = {
  generateEmail,
  generateOTP,
};
