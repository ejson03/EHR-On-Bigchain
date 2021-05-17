const API_PATH = 'http://192.168.33.160:9984/api/v1/'
const driver = require('bigchaindb-driver')
const conn = new driver.Connection(API_PATH)
const bdb = require('easy-bigchain')

let pkey = bdb.generateKeypair('patient');
let dkey = bdb.generateKeypair('doctor');
let akey = bdb.generateKeypair('admin');

const getPublicKey = async(type, email) =>{
    //query = {'email':email, 'type': type}
    const user = await conn.searchAssets(type, email)
    console.log(user)
};


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
};

(async() => {
    // let patient = await createUser('Aluza', 'aluza@gmail.com', 'patient', pkey.publicKey, akey )
    // console.log(patient)
    // let doctor = await createUser('Aluza', 'aluza@gmail.com', 'doctor', dkey.publicKey, akey, 'Hinduja', 'M.D.' )
    // console.log(doctor)
    await getPublicKey('patient', 'aluza@gmail.com');
    console.log("shit");
    await getPublicKey('doctor', 'aluza@gmail.com')
 })();
 