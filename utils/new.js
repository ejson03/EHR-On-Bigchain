let { encryptRSA, encrypt, hash, decrypt } = require("./crypto.js")
const path = require('path');
const fs = require('fs');
//ipfs connection
const ipfsAPI = require('ipfs-api');
const ipfs = ipfsAPI('ipfs.infura.io', '5001', { protocol: 'https' });
const { v4: uuidv4 } = require('uuid');

// bigchaindb connection
const API_PATH = 'http://192.168.33.160:9984/api/v1/'
const driver = require('bigchaindb-driver')
const conn = new driver.Connection(API_PATH)

const createUser = async (name, email, type, publicKey, adminKeys, institution=null, profession=null) =>{
    let asset = {
        'type': type,
        'name': name,
        'email': email,
        'publicKey': publicKey
    };
    if(type == "doctor" & institution != null & profession != null){
        asset['institution'] =  institution
        asset['profession'] = profession
    }
    let metadata = {
        'date': new Date(),
        'timestamp': Date.now()
    };
    const txCreateAliceSimple = driver.Transaction.makeCreateTransaction(
        asset,
        metadata,

        [driver.Transaction.makeOutput(
            driver.Transaction.makeEd25519Condition(adminKeys.publicKey))],
        adminKeys.publicKey
    );
    const txCreateAliceSimpleSigned = driver.Transaction.signTransaction(txCreateAliceSimple, adminKeys.privateKey);
    tx = await conn.postTransactionCommit(txCreateAliceSimpleSigned);
    return tx;
}

const doctorCreateAsset = async(data, email, fpath, publicKey, privateKey) => {
    let file = fs.readFileSync(fpath);
    let cipher = encrypt(file);
    let fileBuffer = new Buffer(cipher);

    let fileIPFS = await ipfs.files.add(fileBuffer)
    console.log("IPFS hash: ", fileIPFS[0].hash);
    let fileIPFSEncrypted = encrypt(fileIPFS[0].hash);
    let id = uuidv4();

    data['email'] = encrypt(email)
    data['file'] = fileIPFSEncrypted
    data['fileHash'] = hash(cipher)
    data['id'] = id

    const metadata = {
        'email': encrypt(email),
        'datetime': new Date().toString(),
        'doclist': [],
        'id': id,
        'status': 'genesis'
    }
    const txCreateAliceSimple = driver.Transaction.makeCreateTransaction(
        data,
        metadata,
        [driver.Transaction.makeOutput(
            driver.Transaction.makeEd25519Condition(publicKey))],
        publicKey
    )
    const txCreateAliceSimpleSigned = driver.Transaction.signTransaction(txCreateAliceSimple, privateKey)
    tx = await conn.postTransactionCommit(txCreateAliceSimpleSigned)
    return tx
};

const clinicianTransferAsset = async () =>{
    
}

