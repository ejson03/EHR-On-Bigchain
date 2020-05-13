let crypto = require('crypto');
let path = require('path')
const fs = require('fs');

const createSecretKey = ()=>{
    return crypto.randomBytes(32);
}

const generateIV = () =>{
    return crypto.randomBytes(16).toString('hex').slice(0, 16);
}
const encrypt = (text="", key="d6F3Efeq") => {
    let cipher = crypto.createCipheriv('aes-256-cbc', key, generateIV())
    let crypted = cipher.update(text, 'utf8', 'hex')
    crypted += cipher.final('hex');
    return crypted;
}

const decrypt = (text="", key="d6F3Efeq") => {
    let decipher = crypto.createDecipheriv('aes-256-cbc', key)
    let dec = decipher.update(text, 'hex', 'utf8')
    dec += decipher.final('utf8');
    return dec;
}



const decryptFile = (text) => {
    let decipher = crypto.createDecipher('aes-256-cbc', 'd6F3Efeq')
    let dec = decipher.update(text, 'hex', 'binary')
    dec += decipher.final('binary');
    return dec;
}

const hash = (text) => {
    return crypto.createHash('sha1').update(JSON.stringify(text)).digest('hex')
}

const generateRSAKeys = (dir) => {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 4096,
        publicKeyEncoding: {
            type: 'pkcs1',
            format: 'pem',
        },
        privateKeyEncoding: {
            type: 'pkcs1',
            format: 'pem',
            cipher: 'aes-256-cbc',
            passphrase: '',
        },
    })
    return [privateKey, publicKey]
}

const encryptRSA = (data, publicKeyPath) => {
    const absolutePath = path.resolve(publicKeyPath)
    console.log(absolutePath)
    const publicKey = fs.readFileSync(absolutePath, 'utf8')
    const buffer = Buffer.from(data, 'utf8')
    const encrypted = crypto.publicEncrypt(publicKey, buffer)
    return encrypted.toString('base64')
}

const decryptRSA = (data, privateKeyPath) => {
    const absolutePath = path.resolve(privateKeyPath)
    const privateKey = fs.readFileSync(absolutePath, 'utf8')
    const buffer = Buffer.from(data, 'base64')
    const decrypted = crypto.privateDecrypt({
            key: privateKey.toString(),
            passphrase: '',
        },
        buffer,
    )
    return decrypted.toString('utf8')
}

module.exports = {
    encrypt,
    decrypt,
    decryptFile,
    encryptRSA,
    decryptRSA,
    hash,
    generateRSAKeys,
    createSecretKey
}