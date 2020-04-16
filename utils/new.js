let { encryptRSA, encrypt, hash, decrypt } = require("./crypto.js");
const path = require('path');
const fs = require('fs');
//ipfs connection
const ipfsAPI = require('ipfs-api');
const ipfs = ipfsAPI('ipfs.infura.io', '5001', { protocol: 'https' });
const { v4: uuidv4 } = require('uuid');

// bigchaindb connection
const API_PATH = 'http://192.168.33.160:9984/api/v1/';
const driver = require('bigchaindb-driver');
const conn = new driver.Connection(API_PATH);

const getPublicKey = async(type, email) =>{
    const user = await conn.searchAssets(email, type);
    return user[0].data.publicKey;
}

const listPrescription = async(type, pemail, cemail) =>{
    let done = []
    let pending = []
    let genesis = await conn.searchMetadata(encrypt(pemail), encrypt(cemail));
    for (index in genesis){
        gasset = await conn.listTransactions(genesis[index].id)[0];
        gassetid = gasset.id;
        asset = await conn.searchAssets(assetid);
        if(asset.length != 0){
            done.push(asset[0].data)
        } else{
            pending.push(gasset)
        }
    }
    if(type=="done"){
        return done
    } else {
        return pending;
    }
}


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

const doctorCreateAsset = async(asset, metadata, fpath, publicKey, privateKey) => {
    let file = fs.readFileSync(fpath);
    let cipher = encrypt(file);
    let fileBuffer = new Buffer(cipher);

    let fileIPFS = await ipfs.files.add(fileBuffer)
    console.log("IPFS hash: ", fileIPFS[0].hash);
    let fileIPFSEncrypted = encrypt(fileIPFS[0].hash);
    let id = uuidv4();

    asset['file'] = fileIPFSEncrypted
    asset['fileHash'] = hash(cipher)
    asset['id'] = id

    metadata['id'] = id

    const txCreateAliceSimple = driver.Transaction.makeCreateTransaction(
        asset,
        metadata,
        [driver.Transaction.makeOutput(
            driver.Transaction.makeEd25519Condition(publicKey))],
            publicKey
    )
    const txCreateAliceSimpleSigned = driver.Transaction.signTransaction(txCreateAliceSimple, privateKey)
    tx = await conn.postTransactionCommit(txCreateAliceSimpleSigned)
    return tx
};


