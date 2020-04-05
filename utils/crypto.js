var crypto = require('crypto');


const encrypt = (text) => {
    var cipher = crypto.createCipher('aes-256-cbc', 'd6F3Efeq')
    var crypted = cipher.update(text, 'utf8', 'hex')
    crypted += cipher.final('hex');
    return crypted;
}

const decrypt = (text) => {
    var decipher = crypto.createDecipher('aes-256-cbc', 'd6F3Efeq')
    var dec = decipher.update(text, 'hex', 'utf8')
    dec += decipher.final('utf8');
    return dec;
}



const decryptFile = (text) => {
    var decipher = crypto.createDecipher('aes-256-cbc', 'd6F3Efeq')
    var dec = decipher.update(text, 'hex', 'binary')
    dec += decipher.final('binary');
    return dec;
}

const hash = (text) => {
    return crypto.createHash('sha1').update(JSON.stringify(text)).digest('hex')
}

const generateKeys = () => {
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

    fs.writeFileSync('keys/private.pem', privateKey)
    fs.writeFileSync('keys/public.pem', publicKey)
}

const encryptRSA = (data, publicKeyPath) => {
    const absolutePath = path.resolve(publicKeyPath)
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