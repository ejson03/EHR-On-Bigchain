require("dotenv").config();

module.exports = {
  port: process.env.PORT,
  secret: process.env.SECRET,
  jwt: {
    secret: process.env.JWT_SECRET,
  },
  vault: {
    url: process.env.VAULT_URL,
    token: process.env.VAULT_TOKEN,
  },
  rasa: {
    url: process.env.RASA_URL || "http://localhost:5005",
    mongo: process.env.MONGO_URL || "mongodb://localhost:27017/",
  },
  bigchain: {
    url: process.env.BIGCHAIN_URL || "http://192.168.99.103:9984/api/v1",
  },
  ipfs: {
    url: process.env.IPFS_URL || "ipfs.infura.io",
    port: "5001",
  },
  email: {
    mail: process.env.EMAIL,
    password: process.env.PASSWORD,
  },
};
