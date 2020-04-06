let crypto = require('crypto');
let path = require('path')
const fs = require('fs');

const encrypt = (text) => {
    let cipher = crypto.createCipher('aes-256-cbc', 'd6F3Efeq')
    let crypted = cipher.update(text, 'utf8', 'hex')
    crypted += cipher.final('hex');
    return crypted;
}

const decrypt = (text) => {
    let decipher = crypto.createDecipher('aes-256-cbc', 'd6F3Efeq')
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

const generateKeys = (dir) => {
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
    kpath = `keys/${dir}`
    fs.mkdirSync(kpath)
    fs.writeFileSync(path.join(kpath, 'private.pem'), privateKey)
    fs.writeFileSync(path.join(kpath, 'public.pem'), publicKey)
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
    generateKeys
}