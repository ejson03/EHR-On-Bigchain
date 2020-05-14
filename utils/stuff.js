let { encryptRSA, encrypt, hash, decrypt } = require("./crypto.js")
let {AddFile} = require("./ipfs.js")
let {getAsset, getMetadata, transferAsset, createAsset, listTransactions} = require("./bigchain.js")
let {generateOTP} = require("../utils/utils.js")

const getRSAKey = async (email, schema) => {
    let asset = await getAsset(email);
    asset.filter((data) => {
        return data['data']['schema'] ==  schema;
    })
    return asset[0]['data']['rsa_key']
}

const getBigchainPublicKey = async (email, schema) => {
    let asset = await getAsset(email);
    asset.filter((data) => {
        return data['data']['schema'] ==  schema;
    })
    return asset[0]['data']['bigchain_key']
}

const getEmail = async (key, schema) => {
    let asset = await getAsset(key);
    asset.filter((data) => {
        return data['data']['schema'] ==  schema;
    })
    return asset[0]['data']['email']
}

const createAccess = async(dlist, publicKey, privateKey, doctorEmail, secretKey) => {
    for (index in dlist) {
        let transaction = await listTransactions(dlist[index])
        data = {
            'email': doctorEmail,
            'key': encryptRSA(secretKey, getRSAKey(doctorEmail, 'doctor'))
        }
        metadata = transaction[transaction.length - 1].metadata
        metadata['doclist'].push(data)
        metdata = JSON.stringify(metadata)
        console.log("metadata is ", metadata)

        let tx = await transferAsset(transaction[transaction.length - 1], metadata, publicKey, privateKey)
        console.log(tx.id)
    }
};

const revokeAccess = async(dlist, publicKey, privateKey, doctorEmail) => {
    for (index in dlist) {
        let transaction = await conn.listTransactions(dlist[index])
        let metadata = transaction[transaction.length - 1].metadata
        let doclist = metadata.doclist
        console.log("Before", doclist.length)
        doclist = doclist.filter(item => item.email != doctorEmail)
        console.log("After", doclist.length)
        metadata.doclist = doclist
        metdata = JSON.stringify(metadata)
        console.log("metadata is ", metadata)
        let tx = await transferAsset(transaction[transaction.length - 1], metadata, publicKey, privateKey)
        console.log(tx.id)
    }
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////

const showAccess = async(demail, records) => {
    let data = []
    for (const asset of records) {
        transaction = await listTransactions(asset.id)
        doclist = transaction[transaction.length - 1].metadata.doclist
        let result = doclist.filter(st => st.email.includes(demail))
        if (result.length == 0) {
            data.push(asset)
        }
    }
    return data
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////

const showRevoke = async(demail, records) => {
    let data = []

    for (const asset of records) {
        transaction = await listTransactions(asset.id)
        doclist = transaction[transaction.length - 1].metadata.doclist
        let result = doclist.filter(st => st.email.includes(demail))
        if (result.length != 0) {
            data.push(asset)
        }
    }
    return data
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////
const createRecord = async(data, email, fpath, publicKey, privateKey, secretKey) => {
    let file = fs.readFileSync(fpath);
    let cipher = encrypt(file, secretKey);
    let fileBuffer = new Buffer(cipher);

    let ipfsURL = await AddFile(fileBuffer);
    let fileIPFSEncrypted = encrypt(ipfsURL, secretKey);
    let id = generateOTP();

    data = {
        ...data,
        'email':email,
        'file':fileIPFSEncrypted,
        'fileHash':hash(cipher),
        'id':id
    }

    let metadata = {
        'email': email,
        'datetime': new Date().toString(),
        'doclist': [],
        'id': id
    }

    let tx = await createAsset(data, metadata, publicKey, privateKey)
    return tx
};

const getAssetHistory = async(assetid) => {
    let transactions = await listTransactions(assetid)
    for (index in transactions) {
        int = []
        int = {
            'operation': transactions[index].operation,
            'date': transactions[index].metadata.datetime,
            'doctor': []
        }
        if (transactions[index].operation == "TRANSFER") {
            if (transactions[index].metadata.doclist.length > 0) {
                for (doc in transactions[index].metadata.doclist) {
                    int['doctor'].push(transactions[index].metadata.doclist[doc].email)
                }
            }
            data.push(int)
        } else {
            data.push(int)
        }
    }
    return data;
}
const getPrescription = async (email, demail) =>{
    data = []
    let assets = await getAsset(demail)
    for (const id in assets) {
        let inter = await getAsset(assets[id].data.assetID)
        if (inter[0].data.email == email) {
            data.push({
                'prescription': assets[0].data.prescription,
                'file': decrypt(inter[0].data.file)
            })
        }
    }
    return data
}
///////////////////////////////////////////////////////////////////////////////////////////////////
const getDoctorFiles = async(email) => {
    let metadata = getMetadata(email);
    let data = [];
    let assetlist = new Set();

    for (const meta of metadata) {
        tx = await listTransactions(meta.id)
        assetlist.add(tx[tx.length - 1].asset.id)
    }
    assetlist = [...assetlist]
    assetlist = assetlist.filter(function(element) {
        return element !== undefined;
    });
    for (const asset of assetlist) {
        tx = await listTransactions(asset)
        docs = tx[tx.length - 1].metadata.doclist
        let result = docs.filter(st => st.email.includes(email))
        if (result.length != 0) {
            let ass = await getAsset(asset)

            data.push({
                'email': ass[0].data.email,
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

///////////////////////////////////////////////////////////////////////////////////////////////////////////
// const getSingleDoctor = async(email, pass, action) => {
//     let data = {}
//     let db = await MongoClient.connect(url);
//     let dbo = db.db("project");
//     let result = await dbo.collection("dsignup").findOne({ email: email });
//     console.log(result);
//     if (action == "login") {
//         if (email == result.email && pass == result.password) {
//             data = {
//                 'email': decrypt(result.email),
//                 'name': `${result.fname} ${result.lname}`,
//                 'qualification': result.qual,
//                 'specialty': result.spl,
//                 'current': result.cw
//             }
//             console.log("login succesful.........");
//         } else {
//             console.log("not okay");
//         }
//     } else {
//         data = {
//             'email': decrypt(result.email),
//             'name': `${result.fname} ${result.lname}`,
//             'qualification': result.qual,
//             'specialty': result.spl,
//             'current': result.cw
//         }
//         console.log("Retrieved dctor deatilas successfully.....");
//     }
//     db.close();
//     return data;

// };
///////////////////////////////////////////////////////////////////////////////////////////////
// const insertDetails = async(collection, myobj) => {
//     let db = await MongoClient.connect(url);
//     let dbo = db.db("project");
//     let result = await dbo.collection(collection).insertOne(myobj);
//     console.log(`Inserted detils into ${collection}`);
//     db.close();
//     return result
// };
/////////////////////////////////////////////////////////////////////////////////////////////////
// const getMultipleDoctors = async() => {
//     let db = await MongoClient.connect(url);
//     let dbo = db.db("project");
//     let result = await dbo.collection('dsignup').find({}).toArray();
//     return result
// };
/////////////////////////////////////////////////////////////////////////////////////////////////
// const getPatient = async(email, pass) => {
//     let data = {}
//     let db = await MongoClient.connect(url);
//     let dbo = db.db("project");
//     let result = await dbo.collection("psignup").findOne({ email: email });

//     console.log(result);
//     if (email == result.email && pass == result.password) {
//         db.close();
//         data = { 'email': result.email }
//         return data;
//     } else {
//         db.close();
//         console.log("not okay");
//     }
// };




module.exports = {
    createAccess,
    revokeAccess,
    showAccess,
    showRevoke,
    createRecord,
    getDoctorFiles,
    getPrescription,
    getAssetHistory
}